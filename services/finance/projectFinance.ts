import { 
  WBSItem, CostRecord, BudgetRecord, EnrichedWBSNode, 
  RevenueRecord, InvoiceRecord, DashboardStats
} from '@/app/types';
import { Decimal } from 'decimal.js';

/**
 * Project Finance Service
 * HARDENED: Uses Decimal.js for high-precision enterprise accounting.
 */
export class ProjectFinance {
  
  /**
   * High-performance WBS tree calculation with rolled-up financial totals.
   */
  static calculateWBSTree(
    wbs: WBSItem[], 
    costs: CostRecord[], 
    budgets: BudgetRecord[]
  ): EnrichedWBSNode[] {
    const itemMap = new Map<string, EnrichedWBSNode>();
    
    // 1. Pre-aggregate costs and budgets for speed
    const costMap = new Map<string, Decimal>();
    costs.forEach(c => {
      const current = costMap.get(c.wbsId) || new Decimal(0);
      costMap.set(c.wbsId, current.plus(c.amount));
    });

    const budgetMap = new Map<string, Decimal>();
    budgets.forEach(b => {
      const current = budgetMap.get(b.wbsId) || new Decimal(0);
      budgetMap.set(b.wbsId, current.plus(b.estimatedAmount));
    });

    // 2. Initialize nodes with direct totals
    wbs.forEach(w => {
      const wbsBudget = budgetMap.get(w.id) || new Decimal(0);
      const wbsActual = costMap.get(w.id) || new Decimal(0);
      const variance = wbsBudget.minus(wbsActual);

      itemMap.set(w.id, {
        ...w,
        children: [],
        level: 0,
        isExpanded: false,
        code: (w as any).code || "",
        budget: wbsBudget.toNumber(),
        actual: wbsActual.toNumber(),
        revenue: 0,
        profit: variance.toNumber(),
        variance: variance.toNumber(),
        percentage: wbsBudget.gt(0) ? wbsActual.dividedBy(wbsBudget).mul(100).toDecimalPlaces(1).toNumber() : 0,
        status: 'ok',
      });
    });

    // 3. Build tree and roll up totals recursively
    const assemble = (parentId: string | null = null, level = 0): EnrichedWBSNode[] => {
      const children: EnrichedWBSNode[] = [];
      
      for (const node of itemMap.values()) {
        if (node.parentId === parentId) {
          const assembledChildren = assemble(node.id, level + 1);
          
          // Roll-up children totals using Decimal for precision
          let childBudget = new Decimal(0);
          let childActual = new Decimal(0);
          
          assembledChildren.forEach(c => {
            childBudget = childBudget.plus(c.budget);
            childActual = childActual.plus(c.actual);
          });
          
          const totalBudget = new Decimal(node.budget).plus(childBudget);
          const totalActual = new Decimal(node.actual).plus(childActual);
          const totalVariance = totalBudget.minus(totalActual);
          
          node.level = level;
          node.children = assembledChildren;
          node.isExpanded = level === 0;
          node.budget = totalBudget.toNumber();
          node.actual = totalActual.toNumber();
          node.variance = totalVariance.toNumber();
          node.profit = node.variance;
          node.percentage = totalBudget.gt(0) ? totalActual.dividedBy(totalBudget).mul(100).toDecimalPlaces(1).toNumber() : 0;
          node.status = node.percentage > 100 ? 'over' : 'ok';
          
          children.push(node);
        }
      }
      return children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    };

    return assemble(null);
  }

  /**
   * Aggregates stats from a WBS tree.
   */
  static calculateStats(tree: EnrichedWBSNode[]) {
    let totalBudget = new Decimal(0);
    let totalActual = new Decimal(0);

    tree.forEach(n => {
      totalBudget = totalBudget.plus(n.budget);
      totalActual = totalActual.plus(n.actual);
    });

    return {
      totalBudget: totalBudget.toNumber(),
      totalActual: totalActual.toNumber(),
      variance: totalBudget.minus(totalActual).toNumber(),
      progress: totalBudget.gt(0) ? totalActual.dividedBy(totalBudget).mul(100).toDecimalPlaces(1).toNumber() : 0
    };
  }

  /**
   * Calculates comprehensive project financial summary.
   * SINGLE SOURCE OF TRUTH for all financial metrics.
   */
  static calculateProjectStats(params: {
    costs: CostRecord[];
    budgets: BudgetRecord[];
    revenues: RevenueRecord[];
    invoices: InvoiceRecord[];
    committedCosts?: { amount: number }[];
    wbsCount: number;
    taskStats: { status: string; _count: { status: number } }[];
  }): DashboardStats {
    const { costs, budgets, revenues, invoices, wbsCount, taskStats } = params;

    // 1. Costs (Decimal)
    const dTotalCost = costs.reduce((s, c) => s.plus(c.amount), new Decimal(0));
    const dPaidCost = costs.filter(c => c.status === "paid").reduce((s, c) => s.plus(c.amount), new Decimal(0));
    const dUnpaidCost = dTotalCost.minus(dPaidCost);

    const costByType: Record<string, number> = {};
    for (const c of costs) {
      const current = new Decimal(costByType[c.costType] || 0);
      costByType[c.costType] = current.plus(c.amount).toNumber();
    }

    // 2. Budgets (Decimal)
    const dTotalBudget = budgets.reduce((s, b) => s.plus(b.estimatedAmount), new Decimal(0));
    const budgetByType: Record<string, number> = {};
    for (const b of budgets) {
      const current = new Decimal(budgetByType[b.costType] || 0);
      budgetByType[b.costType] = current.plus(b.estimatedAmount).toNumber();
    }

    // 3. Revenues (Decimal)
    const dTotalRevenue = revenues.reduce((s, r) => s.plus(r.amount), new Decimal(0));
    const dPaidRevenue = revenues.filter(r => r.status === "paid").reduce((s, r) => s.plus(r.amount), new Decimal(0));
    const dUnpaidRevenue = dTotalRevenue.minus(dPaidRevenue);

    // 4. Invoices (Decimal)
    const dTotalInvoiced = invoices.reduce((s, i) => s.plus(i.amount), new Decimal(0));
    const dTotalPaidInvoice = invoices.reduce((s, i) => s.plus(i.paidAmount), new Decimal(0));
    const dTotalRemainingInvoice = invoices.reduce((s, i) => s.plus(i.remainingAmount), new Decimal(0));
    const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

    // 5. Computed Metrics
    const dProfit = dTotalRevenue.minus(dTotalCost);
    const profitMargin = dTotalRevenue.gt(0) ? dProfit.dividedBy(dTotalRevenue).mul(100).toDecimalPlaces(2).toNumber() : 0;
    const dCostVariance = dTotalBudget.minus(dTotalCost);
    const costOverrunPct = dTotalBudget.gt(0) ? dTotalCost.dividedBy(dTotalBudget).mul(100).toDecimalPlaces(1).toNumber() : 0;

    // 6. ERP Core Metrics
    const dCommittedCost = new Decimal(params.committedCosts?.reduce((s, c) => s + c.amount, 0) || 0);
    const dTotalExposure = dTotalCost.plus(dCommittedCost);
    const dBudgetRemaining = dTotalBudget.minus(dTotalExposure);

    // 7. Tasks
    const taskBreakdown: Record<string, number> = {};
    for (const t of taskStats) {
      taskBreakdown[t.status] = t._count.status;
    }
    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      totalCost: dTotalCost.toNumber(),
      paidCost: dPaidCost.toNumber(),
      unpaidCost: dUnpaidCost.toNumber(),
      costByType,
      totalBudget: dTotalBudget.toNumber(),
      budgetByType,
      costVariance: dCostVariance.toNumber(),
      costOverrunPct,
      isCostOverrun: dTotalCost.gt(dTotalBudget) && dTotalBudget.gt(0),
      totalRevenue: dTotalRevenue.toNumber(),
      paidRevenue: dPaidRevenue.toNumber(),
      unpaidRevenue: dUnpaidRevenue.toNumber(),
      totalInvoiced: dTotalInvoiced.toNumber(),
      totalPaidInvoice: dTotalPaidInvoice.toNumber(),
      totalRemainingInvoice: dTotalRemainingInvoice.toNumber(),
      overdueInvoices: overdueCount,
      profit: dProfit.toNumber(),
      profitMargin,
      taskProgress,
      taskBreakdown,
      wbsCount,
      committedCost: dCommittedCost.toNumber(),
      totalExposure: dTotalExposure.toNumber(),
      budgetRemaining: dBudgetRemaining.toNumber(),
    };
  }
}
