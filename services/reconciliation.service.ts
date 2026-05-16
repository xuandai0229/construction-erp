import { prisma } from "@/lib/prisma";
import { round, safeDecimal } from "@/lib/math";
import { FinancialAggregationService } from "./financial-aggregation.service";

export class ReconciliationService {
  /**
   * Comprehensive Financial Reconciliation for a Project
   * This is the "Hardening" layer that detects drift between different aggregation paths.
   */
  static async runProjectReconciliation(projectId: string) {
    const [project, budgets, approvedCosts, wbsAggregation, snapshot] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null, approvalStatus: "APPROVED" } }),
      FinancialAggregationService.getWBSAggregation(projectId),
      FinancialAggregationService.getProjectSnapshot(projectId)
    ]);

    if (!project) throw new Error("Project not found");

    const issues = [];
    
    // 1. BUDGET INTEGRITY: Project.totalBudget vs SUM(BudgetRecords)
    const recordBudgetTotal = budgets.reduce((s, b) => s.add(safeDecimal(b.estimatedAmount)), safeDecimal(0));
    const projectBudget = safeDecimal(project.totalBudget);
    
    if (!projectBudget.equals(recordBudgetTotal)) {
      issues.push({
        type: "BUDGET_MISMATCH",
        severity: "CRITICAL",
        message: `AUTHORITATIVE MISMATCH: Project totalBudget (${projectBudget}) does not match SUM of BudgetRecords (${recordBudgetTotal}).`,
        diff: projectBudget.sub(recordBudgetTotal).toNumber(),
        expected: recordBudgetTotal.toNumber(),
        actual: projectBudget.toNumber()
      });
    }

    // 2. COST INTEGRITY: Accounting Reality vs WBS Rollup
    const totalActualCosts = approvedCosts.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
    const wbsActualTotal = safeDecimal(wbsAggregation.stats.totalActual);

    if (!totalActualCosts.equals(wbsActualTotal)) {
      issues.push({
        type: "WBS_ACTUAL_MISMATCH",
        severity: "CRITICAL",
        message: `INTEGRITY BREACH: Total approved costs (${totalActualCosts}) != WBS actual rollup (${wbsActualTotal}). Possible orphan or double-count.`,
        diff: totalActualCosts.sub(wbsActualTotal).toNumber(),
        expected: totalActualCosts.toNumber(),
        actual: wbsActualTotal.toNumber()
      });
    }

    // 3. SNAPSHOT CONSISTENCY: Snapshot vs Aggregation Service
    const snapshotActual = safeDecimal(snapshot.reality.actualCost);
    if (!snapshotActual.equals(totalActualCosts)) {
      issues.push({
        type: "SNAPSHOT_DRIFT",
        severity: "CRITICAL",
        message: `RUNTIME DRIFT: Project Snapshot actualCost (${snapshotActual}) != Fresh Calculation (${totalActualCosts}). Invalidation might have failed.`,
        diff: snapshotActual.sub(totalActualCosts).toNumber()
      });
    }

    // 4. ROUNDING INTEGRITY: Check for hidden drift in WBS tree
    const wbsLeavesActual = wbsAggregation.tree
      .filter(n => n.children.length === 0)
      .reduce((s, n) => s.add(safeDecimal(n.actual)), safeDecimal(0));
    
    if (!wbsLeavesActual.equals(wbsActualTotal)) {
       issues.push({
        type: "ROUNDING_DRIFT",
        severity: "WARNING",
        message: `MATHEMATICAL DRIFT: SUM(WBS Leaves) (${wbsLeavesActual}) != WBS Total Rollup (${wbsActualTotal}). Check Decimal.js precision.`,
        diff: wbsLeavesActual.sub(wbsActualTotal).toNumber()
      });
    }

    // 5. REVENUE INTEGRITY
    const totalRevenue = (await prisma.invoice.findMany({
      where: { projectId, deletedAt: null, status: { in: ["SENT", "PAID", "PARTIAL", "OVERDUE"] } }
    })).reduce((s, i) => s.add(safeDecimal(i.amount)), safeDecimal(0));
    
    const snapshotRevenue = safeDecimal(snapshot.reality.totalRevenue);
    if (!snapshotRevenue.equals(totalRevenue)) {
      issues.push({
        type: "REVENUE_MISMATCH",
        severity: "CRITICAL",
        message: `REVENUE MISMATCH: Snapshot revenue (${snapshotRevenue}) != SUM(Invoices) (${totalRevenue}).`,
        diff: snapshotRevenue.sub(totalRevenue).toNumber()
      });
    }

    if (issues.length > 0) {
      await prisma.auditLog.create({
        data: {
          action: "RECONCILIATION_FAILURE",
          entity: "Project",
          entityId: projectId,
          severity: "CRITICAL",
          newData: { issues, timestamp: new Date(), version: snapshot.version },
          reason: "Financial integrity check failed during periodic reconciliation."
        }
      });
    }

    return {
      projectId,
      isHealthy: issues.length === 0,
      issues,
      version: snapshot.version,
      timestamp: new Date()
    };
  }

  /**
   * System-wide Financial Integrity Audit
   */
  static async runGlobalReconciliation() {
    const projects = await prisma.project.findMany({ where: { deletedAt: null }, select: { id: true } });
    const results = [];
    
    for (const p of projects) {
      results.push(await this.runProjectReconciliation(p.id));
    }

    const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);

    return {
      totalProjects: projects.length,
      healthyCount: results.filter(r => r.isHealthy).length,
      criticalCount: results.filter(r => !r.isHealthy).length,
      totalIssues,
      details: results
    };
  }
}
