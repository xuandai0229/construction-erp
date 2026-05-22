import { 
  WBSItem, CostRecord, BudgetRecord, EnrichedWBSNode, 
  RevenueRecord, InvoiceRecord, DashboardStats
} from '@/app/types';
import { round, safeMoney, safePercent, safeDecimal } from '@/lib/math';

export class ProjectFinance {
  /**
   * Optimized WBS tree calculation with rolled-up financial totals.
   * O(N) complexity using Map lookups.
   * Uses explicit Decimal arithmetic for safety.
   */
  static calculateWBSTree(
    wbs: WBSItem[], 
    costs: CostRecord[], 
    budgets: BudgetRecord[],
    revenues: RevenueRecord[] | InvoiceRecord[] = [],
    committedCosts: any[] = [] // Future-proofing for Procurement
  ): EnrichedWBSNode[] {
    // 1. Pre-aggregate budgets, costs, and revenues by wbsId
    const budgetMap = new Map<string, number>();
    budgets.forEach(b => {
      const current = safeDecimal(budgetMap.get(b.wbsId));
      budgetMap.set(b.wbsId, current.add(safeDecimal(b.estimatedAmount)).toNumber());
    });

    const costMap = new Map<string, number>();
    costs.forEach(c => {
      const current = safeDecimal(costMap.get(c.wbsId));
      costMap.set(c.wbsId, current.add(safeDecimal(c.amount)).toNumber());
    });
    
    const revenueMap = new Map<string, number>();
    revenues.forEach(r => {
      const current = safeDecimal(revenueMap.get((r as any).wbsId)); // Invoices or Revenues might have wbsId
      revenueMap.set((r as any).wbsId, current.add(safeDecimal(r.amount)).toNumber());
    });

    // 2. Create nodes with initial direct totals
    const itemMap = new Map<string, EnrichedWBSNode>();
    
    wbs.forEach(w => {
      const wbsBudget = safeDecimal(budgetMap.get(w.id)).add(safeDecimal((w as any).budgetAmount || 0));
      const wbsActual = safeDecimal(costMap.get(w.id));
      const wbsRevenue = safeDecimal(revenueMap.get(w.id));

      itemMap.set(w.id, {
        ...w,
        children: [],
        level: 0,
        isExpanded: false,
        code: (w as any).code || "",
        budget: wbsBudget.toNumber(), // This is the direct budget
        actual: wbsActual.toNumber(), // Direct actual
        revenue: wbsRevenue.toNumber(), // Direct revenue
        profit: wbsRevenue.sub(wbsActual).toNumber(),
        variance: wbsBudget.sub(wbsActual).toNumber(),
        percentage: safePercent(wbsActual, wbsBudget),
        status: 'Chưa triển khai',
      });
    });

    // 3. Build tree and roll up totals (STRICT LINEAR ROLLUP)
    const assemble = (parentId: string | null = null, level = 0, visited = new Set<string>()): EnrichedWBSNode[] => {
      const children: EnrichedWBSNode[] = [];
      
      for (const node of itemMap.values()) {
        if (node.parentId === parentId) {
          // CYCLE DETECTION
          if (visited.has(node.id)) {
            console.error(`[ProjectFinance] CRITICAL ERROR: Circular Reference detected in WBS Tree at node ${node.id}`);
            throw new Error("LỖI HỆ THỐNG: Cây WBS chứa vòng lặp vô hạn (Circular Reference). Dữ liệu bị hỏng.");
          }
          const nextVisited = new Set(visited);
          nextVisited.add(node.id);
          
          const assembledChildren = assemble(node.id, level + 1, nextVisited);
          
          // Roll-up children totals using explicit Decimal logic
          const childBudget = assembledChildren.reduce((s, c) => s.add(safeDecimal(c.budget)), safeDecimal(0));
          const childActual = assembledChildren.reduce((s, c) => s.add(safeDecimal(c.actual)), safeDecimal(0));
          const childRevenue = assembledChildren.reduce((s, c) => s.add(safeDecimal(c.revenue)), safeDecimal(0));
          
          node.level = level;
          node.children = assembledChildren;
          node.isExpanded = level === 0;
          
          // STRICT LINEAR ROLLUP: Parent Total = Direct + Sum(Children)
          const nodeBudget = safeDecimal(node.budget).add(childBudget);
          const nodeActual = safeDecimal(node.actual).add(childActual);
          const nodeRevenue = safeDecimal(node.revenue).add(childRevenue);
          const variance = nodeBudget.sub(nodeActual);
          const profit = nodeRevenue.sub(nodeActual);

          node.budget = nodeBudget.toNumber();
          node.actual = nodeActual.toNumber();
          node.revenue = nodeRevenue.toNumber();
          node.variance = variance.toNumber();
          node.profit = profit.toNumber();
          
          // RE-CALCULATE percentage after rollup
          node.percentage = safePercent(node.actual, node.budget);
          
          // ENTERPRISE STATUS LOGIC
          if (node.percentage >= 100) node.status = 'Hoàn thành';
          else if (node.percentage > 0) node.status = 'Đang thi công';
          else node.status = 'Chưa triển khai';
          
          if (nodeBudget.gt(0) && nodeActual.gt(nodeBudget)) {
            node.status = 'Chậm tiến độ'; // Over budget threshold mapping
          }
          
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
    const totalBudget = tree.reduce((s, n) => s.add(safeDecimal(n.budget)), safeDecimal(0));
    const totalActual = tree.reduce((s, n) => s.add(safeDecimal(n.actual)), safeDecimal(0));
    const variance = totalBudget.sub(totalActual);
    const progress = safePercent(totalActual, totalBudget);

    return {
      totalBudget: totalBudget.toNumber(),
      totalActual: totalActual.toNumber(),
      variance: variance.toNumber(),
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

    // 1. Costs (Explicit Decimal Arithmetic)
    const totalCostD = costs.reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
    const paidCostD = costs.filter(c => c.status === "paid").reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
    const unpaidCostD = totalCostD.sub(paidCostD);

    const costByTypeMap = new Map<string, any>();
    for (const c of costs) {
      const current = safeDecimal(costByTypeMap.get(c.costType));
      costByTypeMap.set(c.costType, current.add(safeDecimal(c.amount)));
    }
    const costByType: Record<string, number> = {};
    costByTypeMap.forEach((val, key) => costByType[key] = val.toNumber());

    // 2. Budgets
    const totalBudgetD = budgets.reduce((s, b) => s.add(safeDecimal(b.estimatedAmount)), safeDecimal(0));
    const budgetByTypeMap = new Map<string, any>();
    for (const b of budgets) {
      const current = safeDecimal(budgetByTypeMap.get(b.costType));
      budgetByTypeMap.set(b.costType, current.add(safeDecimal(b.estimatedAmount)));
    }
    const budgetByType: Record<string, number> = {};
    budgetByTypeMap.forEach((val, key) => budgetByType[key] = val.toNumber());

    // 3. Revenues
    const totalRevenueD = revenues.reduce((s, r) => s.add(safeDecimal(r.amount)), safeDecimal(0));
    const paidRevenueD = revenues.filter(r => r.status === "paid").reduce((s, r) => s.add(safeDecimal(r.amount)), safeDecimal(0));
    const unpaidRevenueD = totalRevenueD.sub(paidRevenueD);

    // 4. Invoices
    const totalInvoicedD = invoices.reduce((s, i) => s.add(safeDecimal(i.amount)), safeDecimal(0));
    const totalPaidInvoiceD = invoices.reduce((s, i) => s.add(safeDecimal(i.paidAmount)), safeDecimal(0));
    const totalRemainingInvoiceD = invoices.reduce((s, i) => s.add(safeDecimal(i.remainingAmount)), safeDecimal(0));
    const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

    // 5. Computed Metrics
    const profitD = totalRevenueD.sub(totalCostD);
    const profitMargin = safePercent(profitD, totalRevenueD);
    const costVarianceD = totalBudgetD.sub(totalCostD);
    const costOverrunPct = safePercent(totalCostD, totalBudgetD);

    // 6. ERP Core Metrics
    const committedCostD = (params.committedCosts || []).reduce((s, c) => s.add(safeDecimal(c.amount)), safeDecimal(0));
    const totalExposureD = totalCostD.add(committedCostD);
    const budgetRemainingD = totalBudgetD.sub(totalExposureD);

    // 7. Tasks
    const taskBreakdown: Record<string, number> = {};
    for (const t of taskStats) {
      taskBreakdown[t.status] = t._count.status;
    }
    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = safePercent(doneTasks, totalTasks);

    return {
      totalCost: totalCostD.toNumber(),
      paidCost: paidCostD.toNumber(),
      unpaidCost: unpaidCostD.toNumber(),
      costByType,
      totalBudget: totalBudgetD.toNumber(),
      budgetByType,
      costVariance: costVarianceD.toNumber(),
      costOverrunPct,
      isCostOverrun: totalCostD.gt(totalBudgetD) && totalBudgetD.gt(0),
      totalRevenue: totalRevenueD.toNumber(),
      paidRevenue: paidRevenueD.toNumber(),
      unpaidRevenue: unpaidRevenueD.toNumber(),
      totalInvoiced: totalInvoicedD.toNumber(),
      totalPaidInvoice: totalPaidInvoiceD.toNumber(),
      totalRemainingInvoice: totalRemainingInvoiceD.toNumber(),
      overdueInvoices: overdueCount,
      profit: profitD.toNumber(),
      profitMargin,
      taskProgress,
      taskBreakdown,
      wbsCount,
      // ERP CORE
      committedCost: committedCostD.toNumber(),
      totalExposure: totalExposureD.toNumber(),
      budgetRemaining: budgetRemainingD.toNumber(),
    };
  }
}
