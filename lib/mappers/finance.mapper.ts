import { DashboardStats } from "@/app/types";

export function mapStatsFromApi(s: any): DashboardStats | null {
  if (!s) return null;
  return {
    totalCost: s.totalCost ?? s.total_cost ?? 0,
    paidCost: s.paidCost ?? s.paid_cost ?? 0,
    unpaidCost: s.unpaidCost ?? s.unpaid_cost ?? 0,
    costByType: s.costByType ?? s.cost_by_type ?? {},
    totalBudget: s.totalBudget ?? s.total_budget ?? 0,
    budgetByType: s.budgetByType ?? s.budget_by_type ?? {},
    costVariance: s.costVariance ?? s.cost_variance ?? 0,
    costOverrunPct: s.costOverrunPct ?? s.cost_overrun_pct ?? 0,
    isCostOverrun: s.isCostOverrun ?? s.is_cost_overrun ?? false,
    totalRevenue: s.totalRevenue ?? s.total_revenue ?? 0,
    paidRevenue: s.paidRevenue ?? s.paid_revenue ?? 0,
    unpaidRevenue: s.unpaidRevenue ?? s.unpaid_revenue ?? 0,
    totalInvoiced: s.totalInvoiced ?? s.total_invoiced ?? 0,
    totalPaidInvoice: s.totalPaidInvoice ?? s.total_paid_invoice ?? 0,
    totalRemainingInvoice: s.totalRemainingInvoice ?? s.total_remaining_invoice ?? 0,
    overdueInvoices: s.overdueInvoices ?? s.overdue_invoices ?? 0,
    profit: s.profit ?? 0,
    profitMargin: s.profitMargin ?? s.profit_margin ?? 0,
    taskProgress: s.taskProgress ?? s.task_progress ?? 0,
    taskBreakdown: s.taskBreakdown ?? s.task_breakdown ?? {},
    wbsCount: s.wbsCount ?? s.wbs_count ?? 0,
    // ERP CORE
    committedCost: s.committedCost ?? s.committed_cost ?? 0,
    totalExposure: s.totalExposure ?? s.total_exposure ?? 0,
    budgetRemaining: s.budgetRemaining ?? s.budget_remaining ?? 0,
  };
}
