import { create } from 'zustand';
import { Project, WBSItem, CostRecord, BudgetRecord, CostType, ProjectStatus, WBSTreeNode } from '@/app/types';
import { DashboardData } from '@/app/components/dashboard-data';
import * as projectService from '@/app/services/project.service';
import * as wbsService from '@/app/services/wbs.service';
import * as costService from '@/app/services/cost.service';
import * as budgetService from '@/app/services/budget.service';
import { ensureDashboardData } from '@/app/components/dashboard-data';

export interface EnrichedWBSNode extends Omit<WBSTreeNode, 'children'> {
  code: string;
  budget: number;
  actual: number;
  variance: number;
  percentage: number;
  status: string;
  children: EnrichedWBSNode[];
}

interface ERPState {
  projects: Project[];
  wbs: WBSItem[];
  costs: CostRecord[];
  budgets: BudgetRecord[];
  currentProjectId: string;
  initialized: boolean;

  // Actions
  init: () => void;
  setCurrentProject: (projectId: string) => void;
  
  addProject: (name: string, investor: string, total_value: number, status: ProjectStatus, start_date?: string, end_date?: string) => { success: boolean; data?: Project; error?: string };
  updateProject: (id: string, updates: Partial<Project>) => { success: boolean; error?: string };
  
  addWBS: (projectId: string, name: string, parentId: string | null) => { success: boolean; error?: string };
  updateWBS: (projectId: string, wbsId: string, updates: Partial<Pick<WBSItem, 'name' | 'parent_id'>>) => { success: boolean; error?: string };
  deleteWBS: (projectId: string, wbsId: string) => { success: boolean; error?: string };
  
  addCost: (projectId: string, wbsId: string, costType: CostType, amount: number, quantity?: number, unitPrice?: number) => { success: boolean; error?: string };
  
  addBudget: (projectId: string, wbsId: string, costType: CostType, estimatedAmount: number) => { success: boolean; error?: string };

  // Getters
  getDashboardData: () => DashboardData;
  getWBSTreeWithCost: () => { tree: EnrichedWBSNode[]; stats: { totalItems: number; totalBudget: number; totalActual: number; variance: number; progress: number } };
  getCostSummary: () => { total: number; byType: Record<string, number> };
}

export const useERPStore = create<ERPState>((set, get) => ({
  projects: [],
  wbs: [],
  costs: [],
  budgets: [],
  currentProjectId: 'proj-screenshot', 
  initialized: false,

  init: () => {
    ensureDashboardData(); 
    const projectId = get().currentProjectId;
    
    set({
      projects: projectService.getProjects(),
      wbs: wbsService.getWBS(projectId),
      costs: costService.getCosts(projectId),
      budgets: budgetService.getBudget(projectId),
      initialized: true,
    });
  },

  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
    get().init(); // Reload related data
  },

  addProject: (name, investor, total_value, status, start_date?, end_date?) => {
    const res = projectService.addProject(name, investor, total_value, status);
    if (res.success && res.data) {
      // Update with dates if provided
      if ((start_date || end_date) && res.data.id) {
        projectService.updateProject(res.data.id, { start_date, end_date });
      }
      set({ projects: projectService.getProjects() });
    }
    return res;
  },

  updateProject: (id, updates) => {
    const res = projectService.updateProject(id, updates);
    if (res.success) {
      set({ projects: projectService.getProjects() });
    }
    return res;
  },

  addWBS: (projectId, name, parentId) => {
    const res = wbsService.addWBS(projectId, name, parentId);
    if (res.success) {
      set({ wbs: wbsService.getWBS(projectId) });
    }
    return res;
  },

  updateWBS: (projectId, wbsId, updates) => {
    const res = wbsService.updateWBS(projectId, wbsId, updates);
    if (res.success) {
      set({ wbs: wbsService.getWBS(projectId) });
    }
    return res;
  },

  deleteWBS: (projectId, wbsId) => {
    const res = wbsService.deleteWBS(projectId, wbsId);
    if (res.success) {
      set({ wbs: wbsService.getWBS(projectId) });
    }
    return res;
  },

  addCost: (projectId, wbsId, costType, amount, quantity = 0, unitPrice = 0) => {
    const res = costService.createCost({ projectId, wbsId, costType, amount, quantity, unitPrice });
    if (res.success) {
      set({ costs: costService.getCosts(projectId) });
    }
    return res;
  },

  addBudget: (projectId, wbsId, costType, estimatedAmount) => {
    const res = budgetService.createBudget({ projectId, wbsId, costType, estimatedAmount });
    if (res.success) {
      set({ budgets: budgetService.getBudget(projectId) });
    }
    return res;
  },

  getDashboardData: () => {
    const { projects, currentProjectId, costs, budgets, wbs } = get();
    const project = projects.find((item) => item.id === currentProjectId) ?? projects[0];

    // Helper functions inside getter
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
      return nodes.map((node) => ({
        id: node.id,
        name: node.name,
        level: node.level,
        budget: sumForWbs(wbs, budgets, node.id, (row) => row.estimated_amount),
        actual: sumForWbs(wbs, costs, node.id, (row) => row.amount),
        children: mapWbsRows(node.children as WBSTreeNode[]),
      }));
    };

    // Make mock cashflow logic
    const seedCashIn = [
      ['01/2024', 5200000000], ['02/2024', 9400000000], ['03/2024', 12800000000], ['04/2024', 16800000000],
      ['05/2024', 22000000000], ['06/2024', 23500000000], ['07/2024', 23000000000], ['08/2024', 29500000000],
      ['09/2024', 35500000000], ['10/2024', 36000000000], ['11/2024', 33000000000], ['12/2024', 38500000000],
      ['01/2025', 39800000000],
    ] as const;

    const makeCashFlow = () => {
      return seedCashIn.map(([month, income]) => {
        const [monthPart, yearPart] = month.split('/');
        const expense = costs
          .filter((cost) => cost.date.startsWith(`${yearPart}-${monthPart}`))
          .reduce((sum, cost) => sum + cost.amount, 0);
        return { month, income, expense };
      });
    };

    const revenue = 25600000000;
    const receivable = { total: 12800000000, paid: 8200000000, remaining: 4600000000, overdue: 850000000 };
    
    const payableTotal = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const payablePaid = costs.filter((cost) => cost.status === 'paid').reduce((sum, cost) => sum + cost.amount, 0);
    const payableRemaining = payableTotal - payablePaid;
    const payable = {
      total: payableTotal,
      paid: payablePaid,
      remaining: payableRemaining,
      overdue: costs.filter((cost) => cost.status === 'unpaid' && cost.date < '2024-06-20').reduce((sum, cost) => sum + cost.amount, 0),
    };
    
    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const costTypeMeta: Record<CostType, { label: string; color: string }> = {
      material: { label: 'Vật liệu', color: '#2563eb' },
      labor: { label: 'Nhân công', color: '#22c55e' },
      machine: { label: 'Máy móc', color: '#f59e0b' },
      subcontract: { label: 'Thầu phụ', color: '#d946ef' },
      overhead: { label: 'Chi phí chung', color: '#0ea5e9' },
      other: { label: 'Khác', color: '#94a3b8' },
    };

    const costByType = (Object.keys(costTypeMeta) as CostType[])
      .filter((type) => type !== 'other')
      .map((type) => ({
        type,
        label: costTypeMeta[type].label,
        color: costTypeMeta[type].color,
        value: costs.filter((cost) => cost.cost_type === type).reduce((sum, cost) => sum + cost.amount, 0),
      }));

    const start = new Date(project?.start_date ?? '2024-01-01');
    const end = new Date(project?.end_date ?? '2025-12-31');
    const reference = new Date('2024-06-20');
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const daysElapsed = Math.max(0, Math.ceil((reference.getTime() - start.getTime()) / 86400000));

    return {
      project,
      budget: budgets,
      costs,
      wbsTree,
      revenue,
      receivable,
      payable,
      costByType: costByType.map((row) => ({ ...row, value: row.value || totalCost * 0.001 })),
      cashFlow: makeCashFlow(),
      wbsRows: mapWbsRows(wbsTree),
      progress: 56,
      daysElapsed,
      durationDays,
    };
  },

  getWBSTreeWithCost: () => {
    const { wbs, budgets, costs, currentProjectId } = get();
    
    const budgetMap = new Map<string, number>();
    budgets.forEach(b => budgetMap.set(b.wbs_id, (budgetMap.get(b.wbs_id) || 0) + b.estimated_amount));
    
    const costMap = new Map<string, number>();
    costs.forEach(c => costMap.set(c.wbs_id, (costMap.get(c.wbs_id) || 0) + c.amount));

    const buildTree = (parentId: string | null, level: number): EnrichedWBSNode[] => {
      const children = wbs.filter(item => item.parent_id === parentId);
      return children.map((child, index) => {
        const grandChildren = buildTree(child.id, level + 1);
        
        let nodeBudget = budgetMap.get(child.id) || 0;
        let nodeActual = costMap.get(child.id) || 0;

        if (grandChildren.length > 0) {
          nodeBudget += grandChildren.reduce((sum, gc) => sum + gc.budget, 0);
          nodeActual += grandChildren.reduce((sum, gc) => sum + gc.actual, 0);
        }

        const variance = nodeActual - nodeBudget;
        const percentage = nodeBudget > 0 ? (nodeActual / nodeBudget) * 100 : 0;

        let status = 'Đang thi công';
        if (child.name === 'Tường') status = 'Chậm tiến độ';
        if (child.name === 'Thang máy' || child.name === 'Cửa, lan can') status = 'Chưa triển khai';

        return {
          id: child.id,
          project_id: child.project_id,
          name: child.name,
          parent_id: child.parent_id,
          created_at: child.created_at,
          level,
          isExpanded: level === 0, 
          code: `HM.${child.id.substring(0, 4)}`, // Fallback, normally needs numbering logic
          budget: nodeBudget,
          actual: nodeActual,
          variance,
          percentage,
          status,
          children: grandChildren
        };
      });
    };

    const tree = buildTree(null, 0);

    // Apply sequential coding similar to the previous logic
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
    // Return formatted summaries
    return {
      total: costs.reduce((s, c) => s + c.amount, 0),
      byType: costs.reduce((acc, cost) => {
        acc[cost.cost_type] = (acc[cost.cost_type] || 0) + cost.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}));
