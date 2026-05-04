import { create } from 'zustand';
import { TaskStatus, Task } from '@prisma/client';
import { 
  Project, WBSItem, CostRecord, BudgetRecord, CostType, ProjectStatus, 
  WBSTreeNode, RevenueRecord, InvoiceRecord, RevenueStatus, 
  PaymentRecord, UserRole, EnrichedWBSNode, MonthlyReport, AgingReportItem 
} from '@/app/types';

import { DashboardData } from '@/app/components/dashboard-data';

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
  snapshots: Record<string, MonthlyReport & { locked_at: string }>;
  userRole: UserRole;
  currentProjectId: string;
  projectStats: any; // Financial summary
  initialized: boolean;

  init: () => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  
  addProject: (name: string, investor: string, total_value: number, status: ProjectStatus, start_date?: string, end_date?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateProject: (id: string, updates: Partial<any>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;

  addTask: (projectId: string, title: string, description?: string, status?: TaskStatus) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  addWBS: (projectId: string, name: string, parentId: string | null) => Promise<{ success: boolean; error?: string }>;
  updateWBS: (projectId: string, wbsId: string, updates: Partial<Pick<WBSItem, 'name' | 'parent_id'>>) => Promise<{ success: boolean; error?: string }>;
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

// Helper to map API WBS → local WBSItem
function mapWBS(raw: any): WBSItem {
  return {
    id: raw.id,
    project_id: raw.projectId,
    name: raw.name,
    parent_id: raw.parentId ?? null,
    children: [],
    created_at: raw.createdAt,
  };
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
  userRole: 'admin',
  currentProjectId: '', 
  projectStats: null,
  initialized: false,

  init: async () => {
    try {
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success) {
        const mapped = json.data.map((p: any) => ({
           id: p.id,
           name: p.name,
           investor: p.owner?.name || "No Investor",
           total_value: 0,
           contract_value: 0,
           status: p.status,
           created_at: p.createdAt,
        }));
        set({ projects: mapped, initialized: true });
        if (mapped.length > 0) {
           const projectId = get().currentProjectId || mapped[0].id;
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

  _refreshProjectData: async (project_id: string) => {
    if (!project_id) return;
    try {
      const [wbsRes, costsRes, budgetsRes, revenuesRes, invoicesRes, paymentsRes, statsRes] = await Promise.all([
        fetch(`/api/wbs?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/costs?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/budgets?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/revenues?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/invoices?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/payments?projectId=${project_id}`).then(r => r.json()),
        fetch(`/api/dashboard/stats?projectId=${project_id}`).then(r => r.json()),
      ]);

      set({
        wbs: wbsRes.success ? wbsRes.data.flat : [],
        costs: costsRes.success ? costsRes.data : [],
        budgets: budgetsRes.success ? budgetsRes.data : [],
        projectStats: statsRes.success ? statsRes.data : null,
        revenues: revenuesRes.success ? revenuesRes.data.map((r: any) => ({
          id: r.id,
          project_id: r.project_id,
          wbs_id: r.wbs_id,
          invoice_id: r.invoice_id,
          amount: r.amount,
          date: r.date,
          status: r.status,
          description: r.description || '',
          created_at: r.created_at,
        })) : [],
        invoices: invoicesRes.success ? invoicesRes.data.map((inv: any) => ({
          id: inv.id,
          project_id: inv.project_id,
          amount: inv.amount,
          issued_date: inv.issued_date,
          paid_amount: inv.paid_amount,
          remaining_amount: inv.remaining_amount,
          status: inv.status,
          created_at: inv.created_at,
        })) : [],
        payments: paymentsRes.success ? paymentsRes.data.map((p: any) => ({
          id: p.id,
          invoice_id: p.invoice_id,
          project_id: p.project_id,
          amount: p.amount,
          date: p.date,
          description: p.description,
          created_at: p.created_at,
        })) : [],
      });
    } catch (e) {
      console.error('_refreshProjectData error:', e);
    }
  },

  setCurrentProject: async (project_id: string) => {
    set({ currentProjectId: project_id });
    await get()._refreshProjectData(project_id);
  },

  addProject: async (name, investor, total_value, status, start_date, end_date) => {
    try {
      const body = { name, status };
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get().init();
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addProject error:', e);
      return { success: false, error: e.message };
    }
  },

  updateProject: async (id, updates) => {
    try {
      const body = { name: updates.name, status: updates.status };
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get().init();
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('updateProject error:', e);
      return { success: false, error: e.message };
    }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await get().init();
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deleteProject error:', e);
      return { success: false, error: e.message };
    }
  },

  addTask: async (project_id, title, description, status) => {
    try {
      const body = { projectId: project_id, title, description, status: status ?? 'TODO' };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        const tasksRes = await fetch(`/api/tasks?projectId=${project_id}`);
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

  addWBS: async (project_id, name, parent_id) => {
    try {
      const body = { project_id, name, parent_id: parent_id ?? null };
      const res = await fetch('/api/wbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addWBS error:', e);
      return { success: false, error: e.message };
    }
  },

  updateWBS: async (project_id, wbs_id, updates) => {
    try {
      const body = {
        name: updates.name,
        parent_id: updates.parent_id ?? null,
      };
      const res = await fetch(`/api/wbs/${wbs_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('updateWBS error:', e);
      return { success: false, error: e.message };
    }
  },

  deleteWBS: async (project_id, wbs_id) => {
    try {
      const res = await fetch(`/api/wbs/${wbs_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deleteWBS error:', e);
      return { success: false, error: e.message };
    }
  },

  addCost: async (project_id, wbs_id, cost_type, amount, quantity, unit_price) => {
    try {
      const body = { project_id, wbs_id, cost_type, amount, quantity, unit_price };
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addCost error:', e);
      return { success: false, error: e.message };
    }
  },

  updateCost: async (project_id, cost_id, updates) => {
    try {
      const body = {
        wbs_id: updates.wbs_id,
        cost_type: updates.cost_type,
        amount: updates.amount,
        quantity: updates.quantity,
        unit_price: updates.unit_price,
        note: updates.note,
        date: updates.date,
        status: updates.status,
      };
      const res = await fetch(`/api/costs/${cost_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('updateCost error:', e);
      return { success: false, error: e.message };
    }
  },

  deleteCost: async (project_id, cost_id) => {
    try {
      const res = await fetch(`/api/costs/${cost_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deleteCost error:', e);
      return { success: false, error: e.message };
    }
  },

  addBudget: async (project_id, wbs_id, cost_type, estimated_amount) => {
    try {
      const body = { project_id, wbs_id, cost_type, estimated_amount };
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addBudget error:', e);
      return { success: false, error: e.message };
    }
  },

  deleteBudget: async (project_id, budget_id) => {
    try {
      const res = await fetch(`/api/budgets/${budget_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deleteBudget error:', e);
      return { success: false, error: e.message };
    }
  },

  addRevenue: async (project_id, wbs_id, amount, status, description, date) => {
    try {
      const body = { project_id, wbs_id, amount, status, description, date };
      const res = await fetch('/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addRevenue error:', e);
      return { success: false, error: e.message };
    }
  },

  updateRevenue: async (id, updates) => {
    try {
      const body = {
        status: updates.status,
        amount: updates.amount,
        description: updates.description,
        date: updates.date,
      };
      const res = await fetch(`/api/revenues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        const { currentProjectId } = get();
        if (currentProjectId) await get()._refreshProjectData(currentProjectId);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('updateRevenue error:', e);
      return { success: false, error: e.message };
    }
  },

  addInvoice: async (project_id, wbs_id, amount, issued_date) => {
    try {
      const body = { project_id, wbs_id, amount, issued_date };
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addInvoice error:', e);
      return { success: false, error: e.message };
    }
  },

  updateInvoice: async (id, updates) => {
    return { success: true };
  },

  deleteInvoice: async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        const { currentProjectId } = get();
        if (currentProjectId) await get()._refreshProjectData(currentProjectId);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deleteInvoice error:', e);
      return { success: false, error: e.message };
    }
  },

  addPayment: async (project_id, invoice_id, amount, date, description) => {
    try {
      const body = { project_id, invoice_id, amount, date, description };
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await get()._refreshProjectData(project_id);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('addPayment error:', e);
      return { success: false, error: e.message };
    }
  },

  updatePayment: async (id, updates) => {
    return { success: true };
  },

  deletePayment: async (id) => {
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        const { currentProjectId } = get();
        if (currentProjectId) await get()._refreshProjectData(currentProjectId);
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e: any) {
      console.error('deletePayment error:', e);
      return { success: false, error: e.message };
    }
  },

  toggleLock: async () => {},
  isPeriodLocked: () => false,
  setUserRole: (role: UserRole) => set({ userRole: role }),
  getFullBackup: () => "{}",
  restoreBackup: async () => ({ success: true }),
  getCostSummary: () => ({ total: 0, byType: {} }),
  recalculateInvoiceBalance: async () => {},

  getMonthlyReport: () => [],
  getAgingReport: () => [],

  getWBSTreeWithCost: () => {
    const { wbs, costs, budgets, projectStats } = get();
    if (!projectStats) return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };

    const buildTree = (items: any[], parentId: string | null = null, level = 0): EnrichedWBSNode[] => {
      return items
        .filter(w => w.parent_id === parentId)
        .map((w, idx) => {
          const wbsBudget = budgets.filter(b => b.wbs_id === w.id).reduce((s, b) => s + b.estimated_amount, 0);
          const wbsActual = costs.filter(c => c.wbs_id === w.id).reduce((s, c) => s + c.amount, 0);
          const children = buildTree(items, w.id, level + 1);
          
          const childBudget = children.reduce((s, c) => s + c.budget, 0);
          const childActual = children.reduce((s, c) => s + c.actual, 0);
          
          const totalBudget = wbsBudget + childBudget;
          const totalActual = wbsActual + childActual;
          const variance = totalBudget - totalActual;
          const percentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
          
          return {
            id: w.id,
            project_id: w.project_id,
            name: w.name,
            parent_id: w.parent_id,
            children,
            created_at: w.created_at,
            level,
            isExpanded: level === 0,
            code: w.code || `${idx + 1}`,
            budget: totalBudget,
            actual: totalActual,
            revenue: 0,
            profit: totalBudget - totalActual,
            variance,
            percentage,
            status: percentage > 100 ? 'over' : 'ok',
          };
        });
    };

    const tree = buildTree(wbs);
    return {
      tree,
      stats: {
        totalItems: wbs.length,
        totalBudget: projectStats.total_budget,
        totalActual: projectStats.total_cost,
        variance: projectStats.cost_variance,
        progress: projectStats.cost_overrun_pct,
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

    const costByTypeArr = Object.entries(projectStats.cost_by_type || {}).map(([type, value]) => ({
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: value as number,
      color: type === 'material' ? '#3b82f6' : type === 'labor' ? '#10b981' : '#f59e0b'
    }));

    return {
      project: {
        ...project,
        total_value: projectStats.total_revenue,
      },
      budget: budgets,
      costs,
      wbsTree: [],
      revenue: projectStats.total_revenue,
      receivable: {
        total: projectStats.total_invoiced,
        paid: projectStats.total_paid_invoice,
        remaining: projectStats.total_remaining_invoice,
        overdue: projectStats.overdue_invoices,
      },
      payable: {
        total: projectStats.total_cost,
        paid: projectStats.paid_cost,
        remaining: projectStats.unpaid_cost,
        overdue: 0,
      },
      costByType: costByTypeArr,
      cashFlow: [],
      wbsRows: [],
      progress: projectStats.task_progress,
      daysElapsed: 0,
      durationDays: 0,
    } as any;
  }
}));
