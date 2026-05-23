import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
type DecimalType = ReturnType<typeof safeDecimal>;
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
    const recordBudgetTotal = budgets.reduce((s: DecimalType, b: { estimatedAmount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(b.estimatedAmount as string | number)), safeDecimal(0));
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
    const totalActualCosts = approvedCosts.reduce((s: DecimalType, c: { amount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(c.amount as string | number)), safeDecimal(0));
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
      .filter((n: { children: unknown[] }) => n.children.length === 0)
      .reduce((s: DecimalType, n: { actual: number | string }) => s.add(safeDecimal(n.actual)), safeDecimal(0));
    
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
    })).reduce((s: DecimalType, i: { amount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(i.amount as string | number)), safeDecimal(0));
    
    const snapshotRevenue = safeDecimal(snapshot.reality.totalRevenue);
    if (!snapshotRevenue.equals(totalRevenue)) {
      issues.push({
        type: "REVENUE_MISMATCH",
        severity: "CRITICAL",
        message: `REVENUE MISMATCH: Snapshot revenue (${snapshotRevenue}) != SUM(Invoices) (${totalRevenue}).`,
        diff: snapshotRevenue.sub(totalRevenue).toNumber()
      });
    }

    // 6. ORPHAN JOURNAL LINES & BALANCING CHECK (Batch 5.6)
    const journalEntries = await prisma.journalEntry.findMany({
      where: { projectId, deletedAt: null },
      include: { lines: true }
    });

    for (const entry of journalEntries) {
      if (entry.lines.length === 0) {
        issues.push({
          type: "ORPHAN_JOURNAL",
          severity: "CRITICAL",
          message: `JOURNAL BREACH: Journal entry ${entry.id} (${entry.reference}) has no debit/credit transaction lines.`,
          expected: 2,
          actual: 0
        });
        continue;
      }

      const debits = entry.lines.filter((l: { type: string; amount: number | string | import("decimal.js").Decimal }) => l.type === "DEBIT").reduce((s: DecimalType, l: { amount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(l.amount as string | number)), safeDecimal(0));
      const credits = entry.lines.filter((l: { type: string; amount: number | string | import("decimal.js").Decimal }) => l.type === "CREDIT").reduce((s: DecimalType, l: { amount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(l.amount as string | number)), safeDecimal(0));

      if (!debits.equals(credits)) {
        issues.push({
          type: "JOURNAL_IMBALANCE",
          severity: "CRITICAL",
          message: `LEDGER BREACH: Journal entry ${entry.id} (${entry.reference}) is imbalanced. Debit (${debits}) != Credit (${credits}).`,
          diff: debits.sub(credits).toNumber(),
          expected: debits.toNumber(),
          actual: credits.toNumber()
        });
      }
    }

    // 7. ORPHAN POSTED COST RECORD CHECK
    const postedCosts = await prisma.costRecord.findMany({
      where: { projectId, workflowStatus: "POSTED", deletedAt: null }
    });

    for (const cost of postedCosts) {
      const correspondingJournal = journalEntries.find((j: { sourceId: string | null; sourceType: string | null }) => j.sourceId === cost.id && j.sourceType === "COST");
      if (!correspondingJournal) {
        issues.push({
          type: "ORPHAN_POSTED_RECORD",
          severity: "CRITICAL",
          message: `INTEGRITY DRIFT: Cost ${cost.id} is marked POSTED but has no active JournalEntry in ledger.`,
          expected: 1,
          actual: 0
        });
      }
    }

    // 8. OVERPAYMENT & OVER-INVOICING CHECKS (Batch 5.1)
    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } }
    });

    for (const inv of invoices) {
      // Overpayment: Payment sum > Invoice amount
      const totalPayments = inv.payments.reduce((s: DecimalType, p: { amount: number | string | import("decimal.js").Decimal }) => s.add(safeDecimal(p.amount as string | number)), safeDecimal(0));
      const invoiceAmount = safeDecimal(inv.amount);

      if (totalPayments.gt(invoiceAmount)) {
        issues.push({
          type: "OVERPAYMENT_DETECTED",
          severity: "CRITICAL",
          message: `OVERPAYMENT: Total payments (${totalPayments}) exceeds Invoice amount (${invoiceAmount}) for Invoice ${inv.id}.`,
          diff: totalPayments.sub(invoiceAmount).toNumber(),
          expected: invoiceAmount.toNumber(),
          actual: totalPayments.toNumber()
        });
      }

      // Negative Payment check
      for (const p of inv.payments) {
        if (Number(p.amount) < 0) {
          issues.push({
            type: "NEGATIVE_PAYABLE_PAYMENT",
            severity: "CRITICAL",
            message: `NEG PAYABLE: Negative payment amount detected: ${p.amount} in Payment ${p.id}.`,
            diff: Number(p.amount)
          });
        }
      }
    }

    // 9. VAT BREAKDOWN CONSISTENCY
    const allCosts = await prisma.costRecord.findMany({
      where: { projectId, deletedAt: null }
    });

    for (const cost of allCosts) {
      const net = safeDecimal(cost.netAmount || 0);
      const vat = safeDecimal(cost.vatAmount || 0);
      const amount = safeDecimal(cost.amount);

      if (net.gt(0) && !net.add(vat).equals(amount)) {
        issues.push({
          type: "VAT_DRIFT",
          severity: "WARNING",
          message: `VAT DRIFT: Cost ${cost.id} amounts are mathematically inconsistent: Net (${net}) + VAT (${vat}) != Gross (${amount}).`,
          diff: net.add(vat).sub(amount).toNumber()
        });
      }
    }

    if (issues.length > 0) {
      const { MetricsCollector } = await import("@/lib/metrics");
      MetricsCollector.recordReconciliationFailure();
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

    const totalIssues = results.reduce((s: number, r: { issues: unknown[] }) => s + r.issues.length, 0);

    return {
      totalProjects: projects.length,
      healthyCount: results.filter((r: { isHealthy: boolean }) => r.isHealthy).length,
      criticalCount: results.filter((r: { isHealthy: boolean }) => !r.isHealthy).length,
      totalIssues,
      details: results
    };
  }
}
