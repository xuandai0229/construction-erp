import { 
  WBSItem, CostRecord, BudgetRecord, EnrichedWBSNode, 
  RevenueRecord, InvoiceRecord, DashboardStats
} from '@/app/types';
import { round, safeMoney, safePercent } from '@/lib/math';

export class ProjectFinance {
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
      budgetMap.set(b.wbsId, round((budgetMap.get(b.wbsId) ?? 0) + safeMoney(b.estimatedAmount)));
    });

    const costMap = new Map<string, number>();
    costs.forEach(c => {
      costMap.set(c.wbsId, round((costMap.get(c.wbsId) ?? 0) + safeMoney(c.amount)));
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
        profit: round(wbsBudget - wbsActual),
        variance: round(wbsBudget - wbsActual),
        percentage: safePercent(wbsActual, wbsBudget),
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
          node.budget = round(node.budget + childBudget);
          node.actual = round(node.actual + childActual);
          node.variance = round(node.budget - node.actual);
          node.profit = node.variance;
          
          // RE-CALCULATE percentage after rollup
          node.percentage = safePercent(node.actual, node.budget);
            
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
    const totalBudget = round(tree.reduce((s, n) => s + n.budget, 0));
    const totalActual = round(tree.reduce((s, n) => s + n.actual, 0));
    const variance = round(totalBudget - totalActual);
    const progress = safePercent(totalActual, totalBudget);

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
    const totalCost = round(costs.reduce((s, c) => s + safeMoney(c.amount), 0));
    const paidCost = round(costs.filter(c => c.status === "paid").reduce((s, c) => s + safeMoney(c.amount), 0));
    const unpaidCost = round(totalCost - paidCost);

    const costByType: Record<string, number> = {};
    for (const c of costs) {
      costByType[c.costType] = round((costByType[c.costType] ?? 0) + safeMoney(c.amount));
    }

    // 2. Budgets
    const totalBudget = round(budgets.reduce((s, b) => s + safeMoney(b.estimatedAmount), 0));
    const budgetByType: Record<string, number> = {};
    for (const b of budgets) {
      budgetByType[b.costType] = round((budgetByType[b.costType] ?? 0) + safeMoney(b.estimatedAmount));
    }

    // 3. Revenues
    const totalRevenue = round(revenues.reduce((s, r) => s + safeMoney(r.amount), 0));
    const paidRevenue = round(revenues.filter(r => r.status === "paid").reduce((s, r) => s + safeMoney(r.amount), 0));
    const unpaidRevenue = round(totalRevenue - paidRevenue);

    // 4. Invoices
    const totalInvoiced = round(invoices.reduce((s, i) => s + safeMoney(i.amount), 0));
    const totalPaidInvoice = round(invoices.reduce((s, i) => s + safeMoney(i.paidAmount), 0));
    const totalRemainingInvoice = round(invoices.reduce((s, i) => s + safeMoney(i.remainingAmount), 0));
    const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

    // 5. Computed Metrics
    const profit = round(totalRevenue - totalCost);
    const profitMargin = safePercent(profit, totalRevenue);
    const costVariance = round(totalBudget - totalCost);
    const costOverrunPct = safePercent(totalCost, totalBudget);

    // 6. NEW: ERP Core Metrics
    const committedCost = round(params.committedCosts?.reduce((s, c) => s + safeMoney(c.amount), 0) || 0);
    const totalExposure = round(totalCost + committedCost);
    const budgetRemaining = round(totalBudget - totalExposure);

    // 7. Tasks
    const taskBreakdown: Record<string, number> = {};
    for (const t of taskStats) {
      taskBreakdown[t.status] = t._count.status;
    }
    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = safePercent(doneTasks, totalTasks);

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
