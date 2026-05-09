import { create } from 'zustand';
import { TaskStatus, Task } from '@prisma/client';
import { 
  Project, WBSItem, CostRecord, BudgetRecord, CostType, ProjectStatus, 
  WBSTreeNode, RevenueRecord, InvoiceRecord, RevenueStatus, 
  PaymentRecord, UserRole, EnrichedWBSNode, MonthlyReport, AgingReportItem 
} from '@/app/types';

import { DashboardData } from '@/app/components/dashboard-data';
import { projectApi } from '@/services/api/project.api';
import { wbsApi } from '@/services/api/wbs.api';
import { costApi } from '@/services/api/cost.api';
import { revenueApi } from '@/services/api/revenue.api';
import { ProjectFinance } from '@/services/finance/projectFinance';

interface ERPState {
  projects: Project[];
  tasks: Task[];
  wbs: WBSItem[];
  costs: CostRecord[];
  budgets: BudgetRecord[];
  revenues: RevenueRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  locks: string[]; 
  snapshots: Record<string, MonthlyReport & { lockedAt: string }>;
  userRole: UserRole;
  currentProjectId: string;
  projectStats: any; // Financial summary
  initialized: boolean;

  init: () => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  
  addProject: (name: string, investor: string, totalValue: number, status: ProjectStatus, startDate?: string, endDate?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;

  addTask: (projectId: string, title: string, description?: string, status?: TaskStatus) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  addWBS: (projectId: string, name: string, parentId: string | null) => Promise<{ success: boolean; error?: string }>;
  updateWBS: (projectId: string, wbsId: string, updates: Partial<Pick<WBSItem, 'name' | 'parentId'>>) => Promise<{ success: boolean; error?: string }>;
  deleteWBS: (projectId: string, wbsId: string) => Promise<{ success: boolean; error?: string }>;
  
  addCost: (projectId: string, wbsId: string, costType: CostType, amount: number, quantity?: number, unitPrice?: number) => Promise<{ success: boolean; error?: string }>;
  updateCost: (projectId: string, costId: string, updates: Partial<CostRecord>) => Promise<{ success: boolean; error?: string }>;
  deleteCost: (projectId: string, costId: string) => Promise<{ success: boolean; error?: string }>;
  
  addBudget: (projectId: string, wbsId: string, costType: CostType, estimatedAmount: number) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (projectId: string, budgetId: string) => Promise<{ success: boolean; error?: string }>;

  addRevenue: (projectId: string, wbsId: string, amount: number, status: RevenueStatus, description: string, date: string) => Promise<{ success: boolean; error?: string }>;
  updateRevenue: (id: string, updates: Partial<RevenueRecord>) => Promise<{ success: boolean; error?: string }>;
  addInvoice: (projectId: string, wbsId: string, amount: number, issuedDate: string) => Promise<{ success: boolean; error?: string }>;
  updateInvoice: (id: string, updates: Partial<InvoiceRecord>) => Promise<{ success: boolean; error?: string }>;
  deleteInvoice: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPayment: (projectId: string, invoiceId: string, amount: number, date: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => Promise<{ success: boolean; error?: string }>;
  deletePayment: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleLock: (month: string) => Promise<void>;
  isPeriodLocked: (date: string) => boolean;
  setUserRole: (role: UserRole) => void;
  getFullBackup: () => string;
  restoreBackup: (json: string) => Promise<{ success: boolean; error?: string }>;

  getDashboardData: () => DashboardData;
  getWBSTreeWithCost: () => { tree: EnrichedWBSNode[]; stats: { totalItems: number; totalBudget: number; totalActual: number; variance: number; progress: number } };
  getCostSummary: () => { total: number; byType: Record<string, number> };
  
  getMonthlyReport: (projectId: string) => MonthlyReport[];
  getAgingReport: (projectId: string) => AgingReportItem[];
  recalculateInvoiceBalance: (invoiceId: string) => Promise<void>;

  // Internal: refresh all data for current project
  _refreshProjectData: (projectId: string) => Promise<void>;
}

export const useERPStore = create<ERPState>((set, get) => ({
  projects: [],
  tasks: [],
  wbs: [],
  costs: [],
  budgets: [],
  revenues: [],
  invoices: [],
  payments: [],
  locks: [],
  snapshots: {},
  userRole: 'ADMIN',
  currentProjectId: '', 
  projectStats: null,
  initialized: false,

  init: async () => {
    try {
      const res = await projectApi.getAll();
      if (res.success && res.data) {
        set({ projects: res.data, initialized: true });
        if (res.data.length > 0) {
           const projectId = get().currentProjectId || res.data[0].id;
           set({ currentProjectId: projectId });
           await get()._refreshProjectData(projectId);
        }
      } else {
        set({ initialized: true });
      }
    } catch (e) {
      console.error('init error:', e);
      set({ initialized: true });
    }
  },

  _refreshProjectData: async (projectId: string) => {
    if (!projectId) return;
    try {
      const [wbsRes, costsRes, budgetsRes, revenuesRes, invoicesRes, paymentsRes, statsRes] = await Promise.all([
        wbsApi.getByProject(projectId),
        costApi.getCostsByProject(projectId),
        costApi.getBudgetsByProject(projectId),
        revenueApi.getRevenuesByProject(projectId),
        revenueApi.getInvoicesByProject(projectId),
        revenueApi.getPaymentsByProject(projectId),
        projectApi.getStats(projectId),
      ]);

      set({
        wbs: wbsRes.success && wbsRes.data ? wbsRes.data.flat : [],
        costs: costsRes.success && costsRes.data ? costsRes.data : [],
        budgets: budgetsRes.success && budgetsRes.data ? budgetsRes.data : [],
        projectStats: statsRes.success ? statsRes.data : null,
        revenues: revenuesRes.success && revenuesRes.data ? revenuesRes.data : [],
        invoices: invoicesRes.success && invoicesRes.data ? invoicesRes.data : [],
        payments: paymentsRes.success && paymentsRes.data ? paymentsRes.data : [],
      });
    } catch (e) {
      console.error('_refreshProjectData error:', e);
    }
  },

  setCurrentProject: async (projectId: string) => {
    set({ currentProjectId: projectId });
    await get()._refreshProjectData(projectId);
  },

  addProject: async (name, investor, totalValue, status, startDate, endDate) => {
    const res = await projectApi.create({ name, investor, totalValue, status, startDate, endDate });
    if (res.success) {
      await get().init();
    }
    return res;
  },

  updateProject: async (id, updates) => {
    const res = await projectApi.update(id, updates);
    if (res.success) {
      await get().init();
    }
    return res as any;
  },

  deleteProject: async (id) => {
    const res = await projectApi.delete(id);
    if (res.success) {
      await get().init();
    }
    return res as any;
  },

  addTask: async (projectId, title, description, status) => {
    try {
      const body = { projectId, title, description, status: status ?? 'TODO' };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        const tasksRes = await fetch(`/api/tasks?projectId=${projectId}`);
        const tasksJson = await tasksRes.json();
        if (tasksJson.success) {
          set({ tasks: tasksJson.data });
        }
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addTask error:', e);
      return { success: false, error: e.message };
    }
  },

  addWBS: async (projectId, name, parentId) => {
    const res = await wbsApi.create({ projectId, name, parentId });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  updateWBS: async (projectId, wbsId, updates) => {
    const res = await wbsApi.update(wbsId, updates);
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  deleteWBS: async (projectId, wbsId) => {
    const res = await wbsApi.delete(wbsId);
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  addCost: async (projectId, wbsId, costType, amount, quantity, unitPrice) => {
    const res = await costApi.createCost({ projectId, wbsId, costType, amount, quantity, unitPrice });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  updateCost: async (projectId, costId, updates) => {
    const res = await costApi.updateCost(costId, updates);
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  deleteCost: async (projectId, costId) => {
    const res = await costApi.deleteCost(costId);
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  addBudget: async (projectId, wbsId, costType, estimatedAmount) => {
    const res = await costApi.createBudget({ projectId, wbsId, costType, estimatedAmount });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  deleteBudget: async (projectId, budgetId) => {
    const res = await costApi.deleteBudget(budgetId);
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  addRevenue: async (projectId, wbsId, amount, status, description, date) => {
    const res = await revenueApi.createRevenue({ projectId, wbsId, amount, status, description, date });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  updateRevenue: async (id, updates) => {
    const res = await revenueApi.updateRevenue(id, updates);
    if (res.success) {
      const { currentProjectId } = get();
      if (currentProjectId) await get()._refreshProjectData(currentProjectId);
    }
    return res as any;
  },

  addInvoice: async (projectId, wbsId, amount, issuedDate) => {
    const res = await revenueApi.createInvoice({ projectId, wbsId, amount, issuedDate });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  updateInvoice: async (id, updates) => {
    return { success: true };
  },

  deleteInvoice: async (id) => {
    const res = await revenueApi.deleteInvoice(id);
    if (res.success) {
      const { currentProjectId } = get();
      if (currentProjectId) await get()._refreshProjectData(currentProjectId);
    }
    return res as any;
  },

  addPayment: async (projectId, invoiceId, amount, date, description) => {
    const res = await revenueApi.createPayment({ projectId, invoiceId, amount, date, description });
    if (res.success) {
      await get()._refreshProjectData(projectId);
    }
    return res as any;
  },

  updatePayment: async (id, updates) => {
    return { success: true };
  },

  deletePayment: async (id) => {
    const res = await revenueApi.deletePayment(id);
    if (res.success) {
      const { currentProjectId } = get();
      if (currentProjectId) await get()._refreshProjectData(currentProjectId);
    }
    return res as any;
  },

  toggleLock: async () => {},
  isPeriodLocked: () => false,
  setUserRole: (role: UserRole) => set({ userRole: role }),
  getFullBackup: () => "{}",
  restoreBackup: async () => ({ success: true }),
  getCostSummary: () => ({ total: 0, byType: {} }),
  recalculateInvoiceBalance: async () => {},

  getMonthlyReport: (projectId: string) => {
    const { revenues, costs, payments } = get();
    const months: Record<string, MonthlyReport> = {};

    // Helper to get month key (YYYY-MM)
    const getMonth = (dateStr: string) => dateStr.substring(0, 7);

    // 1. Process Revenues (Income)
    revenues.forEach(r => {
      const m = getMonth(r.date);
      if (!months[m]) months[m] = { month: m, cashIn: 0, cashOut: 0, revenue: 0, cost: 0, profit: 0, runningBalance: 0 };
      months[m].revenue += Number(r.amount);
    });

    // 2. Process Costs (Expense)
    costs.forEach(c => {
      const m = getMonth(c.date);
      if (!months[m]) months[m] = { month: m, cashIn: 0, cashOut: 0, revenue: 0, cost: 0, profit: 0, runningBalance: 0 };
      months[m].cost += Number(c.amount);
    });

    // 3. Process Payments (Cash In)
    payments.forEach(p => {
      const m = getMonth(p.date);
      if (!months[m]) months[m] = { month: m, cashIn: 0, cashOut: 0, revenue: 0, cost: 0, profit: 0, runningBalance: 0 };
      months[m].cashIn += Number(p.amount);
    });

    // Sort months and calculate profit/balance
    const sortedMonths = Object.keys(months).sort();
    let balance = 0;
    return sortedMonths.map(m => {
      const row = months[m];
      row.cashOut = row.cost; // Simplified: Cost = Cash Out for now
      row.profit = row.revenue - row.cost;
      balance += (row.cashIn - row.cashOut);
      row.runningBalance = balance;
      return row;
    });
  },

  getAgingReport: (projectId: string) => {
    const { invoices, costs } = get();
    const now = new Date();

    const getDaysOverdue = (dateStr: string) => {
      const diff = Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    };

    const getCategory = (days: number) => {
      if (days <= 30) return '0-30';
      if (days <= 60) return '31-60';
      if (days <= 90) return '61-90';
      return '90+';
    };

    const report: AgingReportItem[] = [];

    // Receivable (Invoices)
    invoices.filter(i => i.remainingAmount > 0).forEach(i => {
      const days = getDaysOverdue(i.issuedDate);
      report.push({
        id: i.id,
        type: 'receivable',
        entityName: 'Khách hàng',
        amount: Number(i.remainingAmount),
        date: i.issuedDate,
        daysOverdue: days,
        category: getCategory(days)
      });
    });

    // Payable (Costs)
    costs.filter(c => c.status === 'unpaid').forEach(c => {
      const days = getDaysOverdue(c.date);
      report.push({
        id: c.id,
        type: 'payable',
        entityName: c.supplier || 'Nhiều người bán',
        amount: Number(c.amount),
        date: c.date,
        daysOverdue: days,
        category: getCategory(days)
      });
    });

    return report;
  },

  getWBSTreeWithCost: () => {
    const { wbs, costs, budgets, projectStats } = get();
    if (!projectStats) return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };

    const tree = ProjectFinance.calculateWBSTree(wbs, costs, budgets);
    const stats = ProjectFinance.calculateStats(tree);

    return {
      tree,
      stats: {
        totalItems: wbs.length,
        totalBudget: stats.totalBudget,
        totalActual: stats.totalActual,
        variance: stats.variance,
        progress: stats.progress,
      },
    };
  },

  getDashboardData: () => {
    const { projects, currentProjectId, costs, budgets, wbs, revenues, invoices, payments, projectStats } = get();
    const project = projects.find((item: any) => item.id === currentProjectId) || projects[0] || { id: '', name: 'No Project', total_value: 0, status: 'PLANNED' };

    if (!projectStats) {
      return {
        project,
        budget: budgets,
        costs,
        wbsTree: [],
        revenue: 0,
        receivable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
        payable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
        costByType: [],
        cashFlow: [],
        wbsRows: [],
        progress: 0,
        daysElapsed: 0,
        durationDays: 0,
      } as any;
    }

    const costByTypeArr = Object.entries(projectStats.costByType || {}).map(([type, value]) => ({
      type: type as CostType,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: value as number,
      color: type === 'material' ? '#3b82f6' : type === 'labor' ? '#10b981' : '#f59e0b'
    }));

    return {
      project: {
        ...project,
        totalValue: projectStats.totalRevenue,
      },
      budget: budgets,
      costs,
      wbsTree: [],
      revenue: projectStats.totalRevenue,
      receivable: {
        total: projectStats.totalInvoiced,
        paid: projectStats.totalPaidInvoice,
        remaining: projectStats.totalRemainingInvoice,
        overdue: projectStats.overdueInvoices,
      },
      payable: {
        total: projectStats.totalCost,
        paid: projectStats.paidCost,
        remaining: projectStats.unpaidCost,
        overdue: 0,
      },
      costByType: costByTypeArr,
      cashFlow: [],
      wbsRows: [],
      progress: projectStats.taskProgress,
      daysElapsed: 0,
      durationDays: 0,
    } as any;
  }
}));
