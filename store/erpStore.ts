import { create } from 'zustand';
import { 
  Project, WBSItem, CostRecord, BudgetRecord, CostType, ProjectStatus, 
  WBSTreeNode, RevenueRecord, InvoiceRecord, RevenueStatus, 
  PaymentRecord, UserRole, EnrichedWBSNode, MonthlyReport, AgingReportItem 
} from '@/app/types';
import { DashboardData } from '@/app/components/dashboard-data';
import * as projectService from '@/app/services/project.service';
import * as wbsService from '@/app/services/wbs.service';
import * as costService from '@/app/services/cost.service';
import * as budgetService from '@/app/services/budget.service';
import * as revenueService from '@/app/services/revenue.service';
import * as invoiceService from '@/app/services/invoice.service';
import * as paymentService from '@/app/services/payment.service';
import { ensureDashboardData } from '@/app/components/dashboard-data';

interface ERPState {
  projects: Project[];
  wbs: WBSItem[];
  costs: CostRecord[];
  budgets: BudgetRecord[];
  revenues: RevenueRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  locks: string[]; // Array of YYYY-MM
  snapshots: Record<string, MonthlyReport & { locked_at: string }>; // Persistent totals
  userRole: UserRole;
  currentProjectId: string;
  initialized: boolean;

  // Actions
  init: () => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  
  addProject: (name: string, investor: string, total_value: number, status: ProjectStatus, start_date?: string, end_date?: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  
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

  // Getters
  getDashboardData: () => DashboardData;
  getWBSTreeWithCost: () => { tree: EnrichedWBSNode[]; stats: { totalItems: number; totalBudget: number; totalActual: number; variance: number; progress: number } };
  getCostSummary: () => { total: number; byType: Record<string, number> };
  
  // Business Reporting
  getMonthlyReport: (projectId: string) => MonthlyReport[];
  getAgingReport: (projectId: string) => AgingReportItem[];
  recalculateInvoiceBalance: (invoiceId: string) => Promise<void>;
}

export const useERPStore = create<ERPState>((set, get) => ({
  projects: [],
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
  initialized: false,

  init: async () => {
    try {
      ensureDashboardData(); 
      let pid = get().currentProjectId;
      
      const projectsRes = await projectService.getProjects();
      console.log('[STORE] init: fetch projects', projectsRes);
      
      if (!projectsRes.success) {
        console.error('[STORE ERROR] Failed to fetch projects:', projectsRes.error);
        set({ initialized: true });
        return;
      }

      const projects = projectsRes.data || [];
      
      if (!pid && projects.length > 0) {
        pid = projects[0].id;
      }

      set({ 
        projects,
        currentProjectId: pid,
        // If there are no projects, we're done loading.
        initialized: projects.length === 0 
      });

      if (!pid) {
        console.log('[STORE] init: No projects found, stopping init');
        return; // initialized is already set to true
      }

      const [wbsRes, costsRes, budgetsRes, revenuesRes, invoicesRes, paymentsRes] = await Promise.all([
        wbsService.getWBS(pid),
        costService.getCosts(pid),
        budgetService.getBudget(pid),
        revenueService.getRevenues(pid),
        invoiceService.getInvoices(pid),
        paymentService.getPayments(pid)
      ]);

      console.log('[STORE] init: related data fetch', { wbsRes, costsRes, budgetsRes, revenuesRes, invoicesRes, paymentsRes });

      const updates: Partial<ERPState> = {
        locks: JSON.parse(localStorage.getItem('accounting_locks') || '[]'),
        snapshots: JSON.parse(localStorage.getItem('accounting_snapshots') || '{}'),
        initialized: true,
      };

      if (wbsRes.success) updates.wbs = wbsRes.data || [];
      else console.error('[STORE ERROR] wbs fetch failed:', wbsRes.error);

      if (costsRes.success) updates.costs = costsRes.data || [];
      else console.error('[STORE ERROR] costs fetch failed:', costsRes.error);

      if (budgetsRes.success) updates.budgets = budgetsRes.data || [];
      else console.error('[STORE ERROR] budgets fetch failed:', budgetsRes.error);

      if (revenuesRes.success) updates.revenues = revenuesRes.data || [];
      else console.error('[STORE ERROR] revenues fetch failed:', revenuesRes.error);

      if (invoicesRes.success) updates.invoices = invoicesRes.data || [];
      else console.error('[STORE ERROR] invoices fetch failed:', invoicesRes.error);

      if (paymentsRes.success) updates.payments = paymentsRes.data || [];
      else console.error('[STORE ERROR] payments fetch failed:', paymentsRes.error);

      set(updates);
    } catch (error) {
      console.error('[STORE ERROR] init encountered an unexpected exception:', error);
      set({ initialized: true });
    }
  },

  setCurrentProject: async (projectId: string) => {
    set({ currentProjectId: projectId });
    await get().init(); 
  },

  addProject: async (name, investor, total_value, status, start_date?, end_date?) => {
    const res = await projectService.addProject(name, investor, total_value, status);
    console.log('[STORE] addProject', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }
    
    const project = res.data;
    if ((start_date || end_date) && project && project.id) {
      const updateRes = await projectService.updateProject(project.id, { start_date, end_date });
      console.log('[STORE] addProject (update dates)', updateRes);
      if (!updateRes.success) console.error('[STORE ERROR]', updateRes.error);
    }
    
    if (project && project.id) {
      set({ currentProjectId: project.id });
    }
    
    await get().init();
    return res;
  },

  updateProject: async (id, updates) => {
    const res = await projectService.updateProject(id, updates);
    console.log('[STORE] updateProject', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }
    
    const projectsRes = await projectService.getProjects();
    if (projectsRes.success) {
      set({ projects: projectsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', projectsRes.error);
    }
    return res;
  },

  deleteProject: async (id) => {
    const res = await projectService.deleteProject(id);
    console.log('[STORE] deleteProject', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const projectsRes = await projectService.getProjects();
    if (projectsRes.success) {
      const remaining = projectsRes.data || [];
      set({ projects: remaining });
      if (get().currentProjectId === id) {
        set({ currentProjectId: remaining[0]?.id || '' });
        await get().init();
      }
    } else {
      console.error('[STORE ERROR]', projectsRes.error);
      set({ projects: get().projects.filter(p => p.id !== id) });
    }
    return res;
  },

  addWBS: async (projectId, name, parentId) => {
    const res = await wbsService.addWBS(projectId, name, parentId);
    console.log('[STORE] addWBS', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const wbsRes = await wbsService.getWBS(projectId);
    if (wbsRes.success) {
      set({ wbs: wbsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', wbsRes.error);
    }
    return res;
  },

  updateWBS: async (projectId, wbsId, updates) => {
    const res = await wbsService.updateWBS(projectId, wbsId, updates);
    console.log('[STORE] updateWBS', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const wbsRes = await wbsService.getWBS(projectId);
    if (wbsRes.success) {
      set({ wbs: wbsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', wbsRes.error);
    }
    return res;
  },

  deleteWBS: async (projectId, wbsId) => {
    const hasCost = get().costs.some(c => c.wbs_id === wbsId);
    if (hasCost) return { success: false, error: 'Không thể xóa hạng mục đã có phát sinh chi phí' };

    const res = await wbsService.deleteWBS(projectId, wbsId);
    console.log('[STORE] deleteWBS', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const wbsRes = await wbsService.getWBS(projectId);
    if (wbsRes.success) {
      set({ wbs: wbsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', wbsRes.error);
    }
    return res;
  },

  addCost: async (projectId, wbsId, costType, amount, quantity = 0, unitPrice = 0) => {
    const today = new Date().toISOString().split('T')[0];
    if (get().isPeriodLocked(today)) return { success: false, error: 'Kỳ kế toán đã bị khóa, không thể thêm chi phí' };

    const res = await costService.addCost(projectId, wbsId, costType, amount, quantity, unitPrice);
    console.log('[STORE] addCost', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const costsRes = await costService.getCosts(projectId);
    if (costsRes.success) {
      set({ costs: costsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', costsRes.error);
    }
    return res;
  },

  updateCost: async (projectId, costId, updates) => {
    const cost = get().costs.find(c => c.id === costId);
    if (cost && get().isPeriodLocked(cost.date)) return { success: false, error: 'Không thể sửa chi phí trong kỳ kế toán đã khóa' };

    const res = await costService.updateCost(projectId, costId, updates);
    console.log('[STORE] updateCost', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const costsRes = await costService.getCosts(projectId);
    if (costsRes.success) {
      set({ costs: costsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', costsRes.error);
    }
    return res;
  },

  deleteCost: async (projectId, costId) => {
    if (get().userRole !== 'admin') return { success: false, error: 'Chỉ Admin mới có quyền xóa dữ liệu' };
    const cost = get().costs.find(c => c.id === costId);
    if (cost && get().isPeriodLocked(cost.date)) return { success: false, error: 'Không thể xóa chi phí trong kỳ kế toán đã khóa' };

    const res = await costService.deleteCost(projectId, costId);
    console.log('[STORE] deleteCost', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const costsRes = await costService.getCosts(projectId);
    if (costsRes.success) {
      set({ costs: costsRes.data || [] });
    } else {
      console.error('[STORE ERROR]', costsRes.error);
    }
    return res;
  },

  addBudget: async (projectId, wbsId, costType, estimatedAmount) => {
    const res = await budgetService.addBudget(projectId, wbsId, costType, estimatedAmount);
    console.log('[STORE] addBudget', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const budgetRes = await budgetService.getBudget(projectId);
    if (budgetRes.success) {
      set({ budgets: budgetRes.data || [] });
    } else {
      console.error('[STORE ERROR]', budgetRes.error);
    }
    return res;
  },

  deleteBudget: async (projectId, budgetId) => {
    const res = await budgetService.deleteBudget(projectId, budgetId);
    console.log('[STORE] deleteBudget', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const budgetRes = await budgetService.getBudget(projectId);
    if (budgetRes.success) {
      set({ budgets: budgetRes.data || [] });
    } else {
      console.error('[STORE ERROR]', budgetRes.error);
    }
    return res;
  },

  addRevenue: async (projectId, wbsId, amount, status, description, date) => {
    if (get().isPeriodLocked(date)) return { success: false, error: 'Kỳ kế toán đã bị khóa cho ngày này' };
    const res = await revenueService.addRevenue(projectId, wbsId, amount, status, description, date);
    console.log('[STORE] addRevenue', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const revenuesRes = await revenueService.getRevenues(projectId);
    if (revenuesRes.success) {
      set({ revenues: revenuesRes.data || [] });
    } else {
      console.error('[STORE ERROR]', revenuesRes.error);
    }
    return res;
  },

  addInvoice: async (projectId, wbsId, amount, issuedDate) => {
    if (get().userRole === 'staff') return { success: false, error: 'Nhân viên không có quyền xuất hóa đơn' };
    
    const res = await invoiceService.addInvoice(projectId, amount, issuedDate);
    console.log('[STORE] addInvoice', res);

    if (!res.success || !res.data) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const invoice = res.data;
    const revenueRes = await revenueService.addRevenue(
      projectId,
      wbsId,
      amount,
      'unpaid',
      `Hóa đơn ${invoice.id.substring(0, 8)}`,
      issuedDate,
      invoice.id
    );
    console.log('[STORE] addInvoice (add linked revenue)', revenueRes);
    if (!revenueRes.success) console.error('[STORE ERROR]', revenueRes.error);
    
    const [invoicesRes, revenuesRes] = await Promise.all([
      invoiceService.getInvoices(projectId),
      revenueService.getRevenues(projectId)
    ]);

    const updates: Partial<ERPState> = {};
    if (invoicesRes.success) updates.invoices = invoicesRes.data || [];
    else console.error('[STORE ERROR]', invoicesRes.error);
    
    if (revenuesRes.success) updates.revenues = revenuesRes.data || [];
    else console.error('[STORE ERROR]', revenuesRes.error);

    set(updates);
    
    return res;
  },

  updateRevenue: async (id, updates) => {
    const projectId = get().currentProjectId;
    const res = await revenueService.updateRevenue(projectId, id, updates);
    console.log('[STORE] updateRevenue', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const revenuesRes = await revenueService.getRevenues(projectId);
    if (revenuesRes.success) {
      set({ revenues: revenuesRes.data || [] });
    } else {
      console.error('[STORE ERROR]', revenuesRes.error);
    }
    return res;
  },

  updateInvoice: async (id, updates) => {
    const projectId = get().currentProjectId;
    const res = await invoiceService.updateInvoice(projectId, id, updates);
    console.log('[STORE] updateInvoice', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const invoicesRes = await invoiceService.getInvoices(projectId);
    if (invoicesRes.success) {
      set({ invoices: invoicesRes.data || [] });
    } else {
      console.error('[STORE ERROR]', invoicesRes.error);
    }
    return res;
  },

  deleteInvoice: async (id) => {
    if (get().userRole !== 'admin') return { success: false, error: 'Chỉ Admin mới có quyền xóa hóa đơn' };
    const projectId = get().currentProjectId;
    const res = await invoiceService.deleteInvoice(projectId, id);
    console.log('[STORE] deleteInvoice', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    const pid = get().currentProjectId;
    const [invoicesRes, paymentsRes, revenuesRes] = await Promise.all([
      invoiceService.getInvoices(pid),
      paymentService.getPayments(pid),
      revenueService.getRevenues(pid)
    ]);

    const updates: Partial<ERPState> = {};
    if (invoicesRes.success) updates.invoices = invoicesRes.data || [];
    else console.error('[STORE ERROR]', invoicesRes.error);
    
    if (paymentsRes.success) updates.payments = paymentsRes.data || [];
    else console.error('[STORE ERROR]', paymentsRes.error);
    
    if (revenuesRes.success) updates.revenues = revenuesRes.data || [];
    else console.error('[STORE ERROR]', revenuesRes.error);

    set(updates);
    
    return res;
  },

  addPayment: async (projectId, invoiceId, amount, date, description) => {
    if (get().userRole === 'staff') return { success: false, error: 'Nhân viên không có quyền ghi nhận thanh toán' };
    if (get().isPeriodLocked(date)) return { success: false, error: 'Không thể thêm thanh toán vào kỳ đã khóa' };
    if (amount <= 0) return { success: false, error: 'Số tiền phải lớn hơn 0' };

    const res = await paymentService.addPayment(projectId, invoiceId, amount, date, description);
    console.log('[STORE] addPayment', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    await get().recalculateInvoiceBalance(invoiceId);
    return res;
  },

  updatePayment: async (id, updates) => {
    const payment = get().payments.find(p => p.id === id);
    if (!payment) return { success: false, error: 'Thanh toán không tồn tại' };
    if (get().isPeriodLocked(payment.date)) return { success: false, error: 'Không thể sửa thanh toán trong kỳ đã khóa' };

    const projectId = get().currentProjectId;
    const res = await paymentService.updatePayment(projectId, id, updates);
    console.log('[STORE] updatePayment', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    await get().recalculateInvoiceBalance(payment.invoice_id);
    return res;
  },

  deletePayment: async (id) => {
    if (get().userRole !== 'admin') return { success: false, error: 'Chỉ Admin mới có quyền xóa dữ liệu' };
    const payment = get().payments.find(p => p.id === id);
    if (!payment) return { success: false, error: 'Thanh toán không tồn tại' };
    if (get().isPeriodLocked(payment.date)) return { success: false, error: 'Không thể xóa thanh toán trong kỳ đã khóa' };

    const res = await paymentService.deletePayment(id);
    console.log('[STORE] deletePayment', res);
    
    if (!res.success) {
      console.error('[STORE ERROR]', res.error);
      return res;
    }

    await get().recalculateInvoiceBalance(payment.invoice_id);
    return res;
  },

  recalculateInvoiceBalance: async (invoiceId: string) => {
    const projectId = get().currentProjectId;
    const invoice = get().invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const paymentsRes = await paymentService.getPayments(projectId);
    if (!paymentsRes.success) {
      console.error('[STORE ERROR] recalculateInvoiceBalance: fetch payments failed', paymentsRes.error);
      return;
    }

    const allPayments = (paymentsRes.data || []).filter(p => p.invoice_id === invoiceId);
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = invoice.amount - totalPaid;
    
    const updateRes = await invoiceService.updateInvoice(projectId, invoiceId, {
      paid_amount: totalPaid,
      remaining_amount: remaining,
      status: remaining <= 0 ? 'paid' : 'issued'
    });
    console.log('[STORE] recalculateInvoiceBalance: update invoice', updateRes);
    if (!updateRes.success) console.error('[STORE ERROR]', updateRes.error);

    const [invoicesRes, latestPaymentsRes] = await Promise.all([
      invoiceService.getInvoices(projectId),
      paymentService.getPayments(projectId)
    ]);

    const updates: Partial<ERPState> = {};
    if (latestPaymentsRes.success) updates.payments = latestPaymentsRes.data || [];
    else console.error('[STORE ERROR]', latestPaymentsRes.error);
    
    if (invoicesRes.success) updates.invoices = invoicesRes.data || [];
    else console.error('[STORE ERROR]', invoicesRes.error);

    set(updates);
  },

  toggleLock: async (month) => {
    if (get().userRole !== 'admin') {
      alert('Chỉ Admin mới có quyền Khóa/Mở khóa kỳ kế toán');
      return;
    }
    const currentLocks = get().locks;
    const currentSnapshots = { ...get().snapshots };
    let newLocks;
    
    if (currentLocks.includes(month)) {
      newLocks = currentLocks.filter(m => m !== month);
      delete currentSnapshots[month];
    } else {
      newLocks = [...currentLocks, month];
      const report = get().getMonthlyReport(get().currentProjectId);
      const monthData = report.find(r => r.month === month);
      if (monthData) {
        currentSnapshots[month] = { ...monthData, locked_at: new Date().toISOString() };
      }
    }

    localStorage.setItem('accounting_locks', JSON.stringify(newLocks));
    localStorage.setItem('accounting_snapshots', JSON.stringify(currentSnapshots));
    set({ locks: newLocks, snapshots: currentSnapshots });
  },

  isPeriodLocked: (date) => {
    if (!date) return false;
    const monthKey = date.substring(0, 7); 
    return get().locks.includes(monthKey);
  },

  setUserRole: (role) => set({ userRole: role }),

  getFullBackup: () => {
    const backup = {
      locks: localStorage.getItem('accounting_locks'),
      snapshots: localStorage.getItem('accounting_snapshots'),
    };
    return JSON.stringify(backup);
  },

  restoreBackup: async (json) => {
    try {
      const backup = JSON.parse(json);
      if (backup.locks) localStorage.setItem('accounting_locks', backup.locks);
      if (backup.snapshots) localStorage.setItem('accounting_snapshots', backup.snapshots);
      await get().init();
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Dữ liệu backup không hợp lệ';
      console.error('[STORE ERROR] restoreBackup failed', msg);
      return { success: false, error: msg };
    }
  },

  getDashboardData: () => {
    const { projects, currentProjectId, costs, budgets, wbs, revenues, invoices, payments } = get();
    const project = projects.find((item) => item.id === currentProjectId) || projects[0] || { id: '', name: 'No Project', total_value: 0, status: 'planning' };

    const descendants = (items: WBSItem[], id: string): string[] => {
      const children = items.filter((item) => item.parent_id === id);
      return children.flatMap((child) => [child.id, ...descendants(items, child.id)]);
    };

    const sumForWbs = <T extends { wbs_id: string }>(items: WBSItem[], rows: T[], id: string, getValue: (row: T) => number) => {
      const ids = new Set([id, ...descendants(items, id)]);
      return rows.filter((row) => ids.has(row.wbs_id)).reduce((sum, row) => sum + getValue(row), 0);
    };

    const buildWbsTreeNodes = (parentId: string | null, level: number): WBSTreeNode[] => {
      return wbs.filter(i => i.parent_id === parentId).map(child => ({
        ...child,
        level,
        isExpanded: level === 0,
        children: buildWbsTreeNodes(child.id, level + 1)
      }));
    };
    const wbsTree = buildWbsTreeNodes(null, 0);

    const mapWbsRows = (nodes: WBSTreeNode[]): import('@/app/components/dashboard-data').WBSBudgetRow[] => {
      return nodes.map((node) => {
        const budget = sumForWbs(wbs, budgets, node.id, (row) => row.estimated_amount);
        const actual = sumForWbs(wbs, costs, node.id, (row) => row.amount);
        const nodeRev = sumForWbs(wbs, revenues, node.id, (row) => row.amount);
        return {
          id: node.id,
          name: node.name,
          level: node.level,
          budget,
          actual,
          profit: nodeRev - actual,
          children: mapWbsRows(node.children as WBSTreeNode[]),
        };
      });
    };

    const makeCashFlow = () => {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        months.push(monthStr);
      }

      return months.map((month) => {
        const [monthPart, yearPart] = month.split('/');
        const expense = costs
          .filter((cost) => cost.date.startsWith(`${yearPart}-${monthPart}`) && cost.status === 'paid')
          .reduce((sum, cost) => sum + cost.amount, 0);
        
        const income = payments
          .filter((p) => p.date.startsWith(`${yearPart}-${monthPart}`))
          .reduce((sum, p) => sum + p.amount, 0);

        return { month, income, expense };
      });
    };

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
    
    const receivableTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const receivablePaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const receivableRemaining = receivableTotal - receivablePaid;

    const payableTotal = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const payablePaid = costs.filter((cost) => cost.status === 'paid').reduce((sum, cost) => sum + cost.amount, 0);
    const payableRemaining = payableTotal - payablePaid;

    const receivable = { 
      total: receivableTotal, 
      paid: receivablePaid, 
      remaining: receivableRemaining, 
      overdue: invoices.filter(inv => inv.remaining_amount > 0 && new Date(inv.issued_date) < new Date()).reduce((sum, inv) => sum + inv.remaining_amount, 0)
    };
    
    const payable = {
      total: payableTotal,
      paid: payablePaid,
      remaining: payableRemaining,
      overdue: costs.filter((cost) => cost.status === 'unpaid' && new Date(cost.date) < new Date()).reduce((sum, cost) => sum + cost.amount, 0),
    };
    
    const costTypeMeta: Record<CostType, { label: string; color: string }> = {
      material: { label: 'Vật liệu', color: '#2563eb' },
      labor: { label: 'Nhân công', color: '#22c55e' },
      machine: { label: 'Máy móc', color: '#f59e0b' },
      subcontract: { label: 'Thầu phụ', color: '#d946ef' },
      overhead: { label: 'Chi phí chung', color: '#0ea5e9' },
      other: { label: 'Khác', color: '#94a3b8' },
    };

    const costByType = (Object.keys(costTypeMeta) as CostType[])
      .map((type) => ({
        type,
        label: costTypeMeta[type].label,
        color: costTypeMeta[type].color,
        value: costs.filter((cost) => cost.cost_type === type).reduce((sum, cost) => sum + cost.amount, 0),
      }));

    const start = new Date(project.start_date || new Date().toISOString());
    const end = new Date(project.end_date || new Date().toISOString());
    const dNow = new Date();
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const daysElapsed = Math.max(0, Math.ceil((dNow.getTime() - start.getTime()) / 86400000));
    
    const totalBudget = budgets.reduce((sum, b) => sum + b.estimated_amount, 0);
    const progress = totalBudget > 0 ? Math.min(100, Math.round((totalCost / totalBudget) * 100)) : 0;

    return {
      project,
      budget: budgets,
      costs,
      wbsTree,
      revenue: totalRevenue, 
      receivable,
      payable,
      costByType,
      cashFlow: makeCashFlow(),
      wbsRows: mapWbsRows(wbsTree),
      progress,
      daysElapsed,
      durationDays,
    };
  },

  getWBSTreeWithCost: () => {
    const { wbs, budgets, costs, revenues } = get();
    
    const budgetMap = new Map<string, number>();
    budgets.forEach(b => budgetMap.set(b.wbs_id, (budgetMap.get(b.wbs_id) || 0) + b.estimated_amount));
    
    const costMap = new Map<string, number>();
    costs.forEach(c => costMap.set(c.wbs_id, (costMap.get(c.wbs_id) || 0) + c.amount));

    const revenueMap = new Map<string, number>();
    revenues.forEach(r => revenueMap.set(r.wbs_id, (revenueMap.get(r.wbs_id) || 0) + r.amount));

    const buildTree = (parentId: string | null, level: number): EnrichedWBSNode[] => {
      const children = wbs.filter(item => item.parent_id === parentId);
      return children.map((child) => {
        const grandChildren = buildTree(child.id, level + 1);
        
        let nodeBudget = budgetMap.get(child.id) || 0;
        let nodeActual = costMap.get(child.id) || 0;
        let nodeRevenue = revenueMap.get(child.id) || 0;

        if (grandChildren.length > 0) {
          nodeBudget += grandChildren.reduce((sum, gc) => sum + gc.budget, 0);
          nodeActual += grandChildren.reduce((sum, gc) => sum + gc.actual, 0);
          nodeRevenue += grandChildren.reduce((sum, gc) => sum + gc.revenue, 0);
        }

        const variance = nodeActual - nodeBudget;
        const profit = nodeRevenue - nodeActual;
        const percentage = nodeBudget > 0 ? (nodeActual / nodeBudget) * 100 : 0;

        let status = 'Chưa triển khai';
        if (percentage >= 100) status = 'Hoàn thành';
        else if (percentage > 0) status = 'Đang thi công';

        return {
          id: child.id,
          project_id: child.project_id,
          name: child.name,
          parent_id: child.parent_id,
          created_at: child.created_at,
          level,
          isExpanded: level === 0, 
          code: `HM.${child.id.substring(0, 4)}`,
          budget: nodeBudget,
          actual: nodeActual,
          revenue: nodeRevenue,
          profit,
          variance,
          percentage,
          status,
          children: grandChildren
        };
      });
    };

    const tree = buildTree(null, 0);

    const fixCodes = (nodes: EnrichedWBSNode[], prefix: string) => {
      nodes.forEach((node, i) => {
        node.code = `${prefix}00${i + 1}`.replace(/00(\d\d)$/, '0$1');
        fixCodes(node.children, `${node.code}.`);
      });
    };
    fixCodes(tree, 'HM.');

    const totalBudget = tree.reduce((sum, n) => sum + n.budget, 0);
    const totalActual = tree.reduce((sum, n) => sum + n.actual, 0);
    const variance = totalActual - totalBudget;
    const progress = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return { 
      tree, 
      stats: { totalItems: wbs.length, totalBudget, totalActual, variance, progress } 
    };
  },

  getCostSummary: () => {
    const { costs } = get();
    return {
      total: costs.reduce((s, c) => s + c.amount, 0),
      byType: costs.reduce((acc, cost) => {
        acc[cost.cost_type] = (acc[cost.cost_type] || 0) + cost.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  },

  getMonthlyReport: (projectId) => {
    const { revenues, costs, currentProjectId, payments } = get();
    if (projectId !== currentProjectId) return [];

    const monthMap = new Map<string, MonthlyReport>();
    
    const allDates = [
      ...revenues.map(r => r.date),
      ...costs.map(c => c.date),
      ...payments.map(p => p.date)
    ].sort();

    if (allDates.length === 0) return [];
    
    const startDate = new Date(allDates[0]);
    const endDate = new Date(allDates[allDates.length - 1]);
    
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, {
        month: key,
        revenue: 0,
        cost: 0,
        profit: 0,
        cash_in: 0,
        cash_out: 0,
        running_balance: 0
      });
      current.setMonth(current.getMonth() + 1);
    }

    revenues.forEach(r => {
      const key = r.date.substring(0, 7);
      const row = monthMap.get(key);
      if (row) row.revenue += r.amount;
    });

    payments.forEach(p => {
      const key = p.date.substring(0, 7);
      const row = monthMap.get(key);
      if (row) row.cash_in += p.amount;
    });

    costs.forEach(c => {
      const key = c.date.substring(0, 7);
      const row = monthMap.get(key);
      if (row) {
        row.cost += c.amount;
        if (c.status === 'paid') row.cash_out += c.amount;
      }
    });

    let balance = 0;
    return Array.from(monthMap.values()).map(row => {
      row.profit = row.revenue - row.cost;
      balance += (row.cash_in - row.cash_out);
      row.running_balance = balance;
      return row;
    });
  },

  getAgingReport: (projectId) => {
    const { invoices, costs, currentProjectId, projects } = get();
    if (projectId !== currentProjectId) return [];
    const project = projects.find(p => p.id === projectId);
    const projectName = project?.name || 'Dự án';

    const today = new Date();
    const reports: AgingReportItem[] = [];

    invoices.filter(inv => inv.remaining_amount > 0).forEach(inv => {
      const date = new Date(inv.issued_date);
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      let category: "0-30" | "31-60" | "61-90" | "90+" = '0-30';
      if (diffDays > 90) category = '90+';
      else if (diffDays > 60) category = '61-90';
      else if (diffDays > 30) category = '31-60';

      reports.push({
        id: inv.id,
        type: 'receivable',
        entity_name: projectName,
        amount: inv.remaining_amount,
        date: inv.issued_date,
        days_overdue: diffDays,
        category
      });
    });

    costs.filter(c => c.status === 'unpaid').forEach(c => {
      const date = new Date(c.date);
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      let category: "0-30" | "31-60" | "61-90" | "90+" = '0-30';
      if (diffDays > 90) category = '90+';
      else if (diffDays > 60) category = '61-90';
      else if (diffDays > 30) category = '31-60';

      reports.push({
        id: c.id,
        type: 'payable',
        entity_name: 'Nhà cung cấp / Thầu phụ',
        amount: c.amount,
        date: c.date,
        days_overdue: diffDays,
        category
      });
    });

    return reports.sort((a, b) => b.days_overdue - a.days_overdue);
  }
}));
