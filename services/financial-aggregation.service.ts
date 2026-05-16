import { prisma } from "@/lib/prisma";
import { round, safeMoney, safeDivide, safePercent } from "@/lib/math";
import { 
  ProjectFinancialSnapshot, 
  KPIContract, 
  AggregationStatus,
  WBSAggregationResult
} from "@/app/types/financial";
import { ApiError } from "@/lib/api-error";
import { ProjectFinance } from "./finance/projectFinance";
import { WBSItem, CostRecord, BudgetRecord } from "@/app/types";

/**
 * FINANCIAL AGGREGATION SERVICE (The Single Source of Truth)
 * 
 * This service is the final authority for all financial calculations in the ERP.
 * It enforces the separation between Accounting Reality and Management Exposure.
 */
export class FinancialAggregationService {
  
  /**
   * PERIOD CLOSE GOVERNANCE: Verifies if a date falls within a locked fiscal period.
   * Prevents retrospective changes to locked accounting eras.
   */
  static async validateTransactionDate(date: Date) {
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
    const period = await prisma.fiscalPeriod.findUnique({
      where: { month: monthStr }
    });

    if (period && period.isLocked) {
      throw new ApiError(400, `LỖI NGHIỆP VỤ: Kỳ kế toán ${monthStr} đã khóa. Không thể thực hiện thay đổi hạch toán.`, {
        isPeriodLocked: true,
        month: monthStr
      });
    }
    return true;
  }

  /**
   * Generates a comprehensive financial snapshot for a project.
   * This is the master method for Dashboard and Executive Cockpit.
   */
  static async getProjectSnapshot(projectId: string): Promise<ProjectFinancialSnapshot> {
    const [costs, invoices, budgets, project] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.invoice.findMany({ where: { projectId, deletedAt: null } }),
      prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!project) throw new Error("Project not found");

    // 1. KPI CONTRACT: COST_ACT (Accounting Reality)
    const costActual = costs
      .filter(c => ["APPROVED", "POSTED", "LOCKED"].includes(c.workflowStatus || c.approvalStatus))
      .reduce((s, c) => s + safeMoney(c.amount), 0);

    // 2. KPI CONTRACT: COST_EXP (Management Exposure)
    const costExposure = costs
      .filter(c => !["VOID", "REJECTED"].includes(c.workflowStatus || ""))
      .reduce((s, c) => s + safeMoney(c.amount), 0);

    // 3. KPI CONTRACT: REV_ACC (Accrual Revenue)
    const revenueAccrual = invoices
      .filter(i => ["SENT", "PAID", "PARTIAL", "OVERDUE"].includes(i.status))
      .reduce((s, i) => s + safeMoney(i.amount), 0);

    // 4. KPI CONTRACT: ALLOCATION_HEALTH
    const wbsData = await prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, select: { id: true } });
    const wbsIds = new Set(wbsData.map(w => w.id));
    const unallocatedCosts = costs.filter(c => !c.wbsId || !wbsIds.has(c.wbsId));
    const unallocatedAmount = unallocatedCosts.reduce((s, c) => s + safeMoney(c.amount), 0);
    const allocationHealth = safePercent(costs.length - unallocatedCosts.length, costs.length || 100);

    // 5. BUDGET UTILIZATION
    const totalBudget = safeMoney(project.totalBudget);
    const budgetUtilization = safePercent(costExposure, totalBudget);

    // 6. PROFITABILITY
    const profitRealized = round(revenueAccrual - costActual);
    const profitMargin = safePercent(profitRealized, revenueAccrual);

    // 7. SNAPSHOT VERSIONING (The "Financial Era")
    const maxUpdate = Math.max(
      ...costs.map(c => c.updatedAt.getTime()),
      ...invoices.map(i => i.updatedAt.getTime()),
      ...budgets.map(b => b.updatedAt.getTime()),
      project.updatedAt.getTime()
    );
    const version = `v${maxUpdate}`;

    return {
      projectId,
      timestamp: new Date(),
      version,
      reality: {
        totalRevenue: round(revenueAccrual),
        actualCost: round(costActual),
        grossProfit: profitRealized,
        grossMargin: profitMargin,
      },
      exposure: {
        totalCostExposure: round(costExposure),
        pendingCost: round(costExposure - costActual),
        budgetUtilization,
        isOverBudget: costExposure > totalBudget && totalBudget > 0,
      },
      integrity: {
        unallocatedAmount: round(unallocatedAmount),
        allocationHealth,
        orphanCount: unallocatedCosts.length,
      }
    };
  }

  /**
   * Aggregates WBS data ensuring the "Unallocated" virtual node is included.
   * This guarantees Total WBS Actual == Accounting Reality Actual.
   */
  static async getWBSAggregation(projectId: string): Promise<WBSAggregationResult> {
    const [items, costs, budgets] = await Promise.all([
      prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } })
    ]);

    const wbsIds = new Set(items.map(i => i.id));
    const approvedCosts = costs.filter(c => ["APPROVED", "POSTED", "LOCKED"].includes(c.workflowStatus || c.approvalStatus));
    
    // Find Orphans (Costs not linked to active WBS)
    const orphanCosts = approvedCosts.filter(c => !c.wbsId || !wbsIds.has(c.wbsId));
    const orphanTotal = orphanCosts.reduce((s, c) => s + safeMoney(c.amount), 0);

    // Initial Tree (using legacy ProjectFinance for rollup)
    const tree = ProjectFinance.calculateWBSTree(
      items as unknown as WBSItem[], 
      approvedCosts as unknown as CostRecord[], 
      budgets as unknown as BudgetRecord[]
    );

    // Add Virtual Node if Orphans exist
    if (orphanTotal > 0) {
      tree.push({
        id: "virtual-unallocated",
        name: "⚠️ CHI PHÍ CHƯA PHÂN BỔ (ORPHANS)",
        code: "UNALLOC",
        budget: 0,
        actual: round(orphanTotal),
        variance: round(-orphanTotal),
        percentage: 100,
        revenue: 0,
        profit: round(-orphanTotal),
        status: 'over',
        level: 0,
        children: [],
        isExpanded: true,
        projectId,
        sortOrder: 999,
        budgetAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: null
      });
    }

    return {
      tree,
      stats: {
        totalApproved: round(approvedCosts.reduce((s, c) => s + safeMoney(c.amount), 0)),
        orphanTotal: round(orphanTotal),
        healthScore: safePercent(approvedCosts.length - orphanCosts.length, approvedCosts.length)
      }
    };
  }
}
