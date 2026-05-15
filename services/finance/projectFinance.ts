import { 
  WBSItem, CostRecord, BudgetRecord, EnrichedWBSNode, 
  RevenueRecord, InvoiceRecord, DashboardStats
} from '@/app/types';

export class ProjectFinance {
  /**
   * Safe rounding to 2 decimal places for financial accuracy.
   */
  private static round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Optimized WBS tree calculation with rolled-up financial totals.
   * O(N) complexity using Map lookups.
   */
  static calculateWBSTree(
    wbs: WBSItem[], 
    costs: CostRecord[], 
    budgets: BudgetRecord[]
  ): EnrichedWBSNode[] {
    // 1. Pre-aggregate budgets and costs by wbsId for O(1) lookup
    const budgetMap = new Map<string, number>();
    budgets.forEach(b => {
      budgetMap.set(b.wbsId, this.round((budgetMap.get(b.wbsId) ?? 0) + b.estimatedAmount));
    });

    const costMap = new Map<string, number>();
    costs.forEach(c => {
      costMap.set(c.wbsId, this.round((costMap.get(c.wbsId) ?? 0) + c.amount));
    });

    // 2. Create nodes with initial direct totals
    const itemMap = new Map<string, EnrichedWBSNode>();
    
    wbs.forEach(w => {
      const wbsBudget = budgetMap.get(w.id) ?? 0;
      const wbsActual = costMap.get(w.id) ?? 0;

      itemMap.set(w.id, {
        ...w,
        children: [],
        level: 0,
        isExpanded: false,
        code: (w as any).code || "",
        budget: wbsBudget,
        actual: wbsActual,
        revenue: 0,
        profit: this.round(wbsBudget - wbsActual),
        variance: this.round(wbsBudget - wbsActual),
        // ACCURACY FIX: If budget is 0 but actual > 0, it's 100% overrun
        percentage: wbsBudget > 0 
          ? this.round((wbsActual / wbsBudget) * 100) 
          : (wbsActual > 0 ? 100 : 0),
        status: 'ok',
      });
    });

    // 3. Build tree and roll up totals using post-order traversal logic
    const assemble = (parentId: string | null = null, level = 0): EnrichedWBSNode[] => {
      const children: EnrichedWBSNode[] = [];
      
      for (const node of itemMap.values()) {
        if (node.parentId === parentId) {
          const assembledChildren = assemble(node.id, level + 1);
          
          // Roll-up children totals into this node
          const childBudget = assembledChildren.reduce((s, c) => s + c.budget, 0);
          const childActual = assembledChildren.reduce((s, c) => s + c.actual, 0);
          
          node.level = level;
          node.children = assembledChildren;
          node.isExpanded = level === 0;
          node.budget = this.round(node.budget + childBudget);
          node.actual = this.round(node.actual + childActual);
          node.variance = this.round(node.budget - node.actual);
          node.profit = node.variance;
          
          // RE-CALCULATE percentage after rollup
          node.percentage = node.budget > 0 
            ? this.round((node.actual / node.budget) * 100) 
            : (node.actual > 0 ? 100 : 0);
            
          node.status = node.percentage > 100 ? 'over' : 'ok';
          
          children.push(node);
        }
      }
      return children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    };

    return assemble(null);
  }

  /**
   * Aggregates stats from a WBS tree for the store.
   */
  static calculateStats(tree: EnrichedWBSNode[]) {
    const totalBudget = this.round(tree.reduce((s, n) => s + n.budget, 0));
    const totalActual = this.round(tree.reduce((s, n) => s + n.actual, 0));
    const variance = this.round(totalBudget - totalActual);
    const progress = totalBudget > 0 ? this.round((totalActual / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalActual,
      variance,
      progress
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
    committedCosts?: { amount: number }[]; // From POs
    wbsCount: number;
    taskStats: { status: string; _count: { status: number } }[];
  }): DashboardStats {
    const { costs, budgets, revenues, invoices, wbsCount, taskStats } = params;

    // 1. Costs
    const totalCost = this.round(costs.reduce((s, c) => s + c.amount, 0));
    const paidCost = this.round(costs.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0));
    const unpaidCost = this.round(totalCost - paidCost);

    const costByType: Record<string, number> = {};
    for (const c of costs) {
      costByType[c.costType] = this.round((costByType[c.costType] ?? 0) + c.amount);
    }

    // 2. Budgets
    const totalBudget = this.round(budgets.reduce((s, b) => s + b.estimatedAmount, 0));
    const budgetByType: Record<string, number> = {};
    for (const b of budgets) {
      budgetByType[b.costType] = this.round((budgetByType[b.costType] ?? 0) + b.estimatedAmount);
    }

    // 3. Revenues
    const totalRevenue = this.round(revenues.reduce((s, r) => s + r.amount, 0));
    const paidRevenue = this.round(revenues.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0));
    const unpaidRevenue = this.round(totalRevenue - paidRevenue);

    // 4. Invoices
    const totalInvoiced = this.round(invoices.reduce((s, i) => s + i.amount, 0));
    const totalPaidInvoice = this.round(invoices.reduce((s, i) => s + i.paidAmount, 0));
    const totalRemainingInvoice = this.round(invoices.reduce((s, i) => s + i.remainingAmount, 0));
    const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

    // 5. Computed Metrics
    const profit = this.round(totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? this.round((profit / totalRevenue) * 100) : 0;
    const costVariance = this.round(totalBudget - totalCost);
    const costOverrunPct = totalBudget > 0 ? this.round((totalCost / totalBudget) * 100) : 0;

    // 6. NEW: ERP Core Metrics
    const committedCost = this.round(params.committedCosts?.reduce((s, c) => s + c.amount, 0) || 0);
    const totalExposure = this.round(totalCost + committedCost);
    const budgetRemaining = this.round(totalBudget - totalExposure);

    // 7. Tasks
    const taskBreakdown: Record<string, number> = {};
    for (const t of taskStats) {
      taskBreakdown[t.status] = t._count.status;
    }
    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      totalCost,
      paidCost,
      unpaidCost,
      costByType,
      totalBudget,
      budgetByType,
      costVariance,
      costOverrunPct,
      isCostOverrun: totalCost > totalBudget && totalBudget > 0,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      totalInvoiced,
      totalPaidInvoice,
      totalRemainingInvoice,
      overdueInvoices: overdueCount,
      profit,
      profitMargin,
      taskProgress,
      taskBreakdown,
      wbsCount,
      // ERP CORE
      committedCost,
      totalExposure,
      budgetRemaining,
    };
  }
}
