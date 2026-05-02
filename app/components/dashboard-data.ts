'use client';

import { BudgetRecord, CostRecord, CostType, Project, WBSItem, WBSTreeNode } from '@/app/types';
import { addBudget, getBudget } from '@/app/services/budget.service';
import { addCost, getCosts } from '@/app/services/cost.service';
import { addProject, getProjects, updateProject } from '@/app/services/project.service';
import { addWBS, buildWBSTree, getWBS } from '@/app/services/wbs.service';

const REVENUE_KEY = 'construction_erp_revenue_proj-abc';
const RECEIVABLE_KEY = 'construction_erp_receivable_proj-abc';
const PROJECT_ID = 'proj-abc';

export type CostTypeRow = {
  type: CostType;
  label: string;
  value: number;
  color: string;
};

export type CashFlowPoint = {
  month: string;
  income: number;
  expense: number;
};

export type DebtSummary = {
  total: number;
  paid: number;
  remaining: number;
  overdue: number;
};

export type WBSBudgetRow = {
  id: string;
  name: string;
  level: number;
  budget: number;
  actual: number;
  children: WBSBudgetRow[];
};

export type DashboardData = {
  project: Project;
  budget: BudgetRecord[];
  costs: CostRecord[];
  wbsTree: WBSTreeNode[];
  revenue: number;
  receivable: DebtSummary;
  payable: DebtSummary;
  costByType: CostTypeRow[];
  cashFlow: CashFlowPoint[];
  wbsRows: WBSBudgetRow[];
  progress: number;
  daysElapsed: number;
  durationDays: number;
};

const costTypeMeta: Record<CostType, { label: string; color: string }> = {
  material: { label: 'Vật liệu', color: '#2563eb' },
  labor: { label: 'Nhân công', color: '#22c55e' },
  machine: { label: 'Máy móc', color: '#f59e0b' },
  subcontract: { label: 'Thầu phụ', color: '#d946ef' },
  overhead: { label: 'Chi phí chung', color: '#0ea5e9' },
  other: { label: 'Khác', color: '#94a3b8' },
};

const seedWbs = [
  { id: 'wbs-foundation', name: '1. MÓNG', parent: null },
  { id: 'wbs-piles', name: '1.1 Móng cọc', parent: 'wbs-foundation' },
  { id: 'wbs-strip', name: '1.2 Móng băng', parent: 'wbs-foundation' },
  { id: 'wbs-structure', name: '2. KẾT CẤU', parent: null },
  { id: 'wbs-columns', name: '2.1 Cột', parent: 'wbs-structure' },
  { id: 'wbs-beams', name: '2.2 Dầm, sàn', parent: 'wbs-structure' },
  { id: 'wbs-walls', name: '2.3 Tường', parent: 'wbs-structure' },
  { id: 'wbs-stairs', name: '2.4 Cầu thang', parent: 'wbs-structure' },
  { id: 'wbs-elevator', name: '2.5 Thang máy', parent: 'wbs-structure' },
  { id: 'wbs-finishing', name: '3. HOÀN THIỆN', parent: null },
  { id: 'wbs-mep', name: '4. ĐIỆN NƯỚC', parent: null },
  { id: 'wbs-landscape', name: '5. CẢNH QUAN', parent: null },
];

const seedBudget = [
  ['wbs-piles', 'material', 1800000000],
  ['wbs-piles', 'labor', 900000000],
  ['wbs-piles', 'machine', 500000000],
  ['wbs-strip', 'material', 900000000],
  ['wbs-strip', 'labor', 550000000],
  ['wbs-strip', 'machine', 350000000],
  ['wbs-columns', 'material', 2400000000],
  ['wbs-columns', 'labor', 1200000000],
  ['wbs-columns', 'machine', 900000000],
  ['wbs-beams', 'material', 3200000000],
  ['wbs-beams', 'labor', 1800000000],
  ['wbs-beams', 'machine', 1000000000],
  ['wbs-walls', 'material', 2200000000],
  ['wbs-walls', 'labor', 1300000000],
  ['wbs-walls', 'overhead', 500000000],
  ['wbs-stairs', 'material', 1200000000],
  ['wbs-stairs', 'labor', 800000000],
  ['wbs-stairs', 'machine', 500000000],
  ['wbs-elevator', 'subcontract', 3000000000],
  ['wbs-finishing', 'material', 4500000000],
  ['wbs-finishing', 'labor', 3000000000],
  ['wbs-finishing', 'subcontract', 3000000000],
  ['wbs-finishing', 'overhead', 1500000000],
  ['wbs-mep', 'material', 2500000000],
  ['wbs-mep', 'labor', 1500000000],
  ['wbs-mep', 'subcontract', 1000000000],
  ['wbs-landscape', 'material', 1200000000],
  ['wbs-landscape', 'labor', 800000000],
  ['wbs-landscape', 'overhead', 1000000000],
] as const;

const seedCosts = [
  ['2024-01-20', 'Tạm ứng vật liệu móng', 'wbs-piles', 'material', 'Công ty VLXD Hòa Phát', 900000000, 'paid'],
  ['2024-02-18', 'Nhân công khoan cọc', 'wbs-piles', 'labor', 'Đội thi công số 1', 760000000, 'paid'],
  ['2024-03-15', 'Thuê máy ép cọc', 'wbs-piles', 'machine', 'Cơ giới Minh Tâm', 420000000, 'paid'],
  ['2024-03-28', 'Bê tông móng băng', 'wbs-strip', 'material', 'Bê tông Việt Đức', 780000000, 'paid'],
  ['2024-04-18', 'Nhân công móng băng', 'wbs-strip', 'labor', 'Đội thi công số 2', 430000000, 'paid'],
  ['2024-05-20', 'Cốt thép cột tầng 1-4', 'wbs-columns', 'material', 'Thép Việt Nhật', 1700000000, 'paid'],
  ['2024-06-20', 'Mua thép D16', 'wbs-columns', 'material', 'Công ty Thép An Bình', 235000000, 'paid'],
  ['2024-06-19', 'Thanh toán nhân công', 'wbs-columns', 'labor', 'Đội kết cấu Nam Long', 120000000, 'paid'],
  ['2024-06-18', 'Thuê máy cẩu', 'wbs-beams', 'machine', 'Cẩu tháp Đông Á', 80000000, 'unpaid'],
  ['2024-06-17', 'Thanh toán thầu phụ', 'wbs-beams', 'subcontract', 'Nhà thầu phụ Kết Cấu', 150000000, 'paid'],
  ['2024-06-16', 'Mua xi măng, cát đá', 'wbs-strip', 'material', 'VLXD Hưng Phát', 95000000, 'paid'],
  ['2024-07-22', 'Bê tông dầm sàn', 'wbs-beams', 'material', 'Bê tông Việt Đức', 2600000000, 'paid'],
  ['2024-08-12', 'Nhân công dầm sàn', 'wbs-beams', 'labor', 'Đội kết cấu Nam Long', 1370000000, 'paid'],
  ['2024-09-05', 'Xây tường bao', 'wbs-walls', 'material', 'Gạch Tuynel Thăng Long', 1430000000, 'unpaid'],
  ['2024-09-24', 'Nhân công xây tường', 'wbs-walls', 'labor', 'Đội xây tô Minh Phát', 940000000, 'paid'],
  ['2024-10-10', 'Cầu thang bộ', 'wbs-stairs', 'material', 'Cơ khí Hưng Thịnh', 850000000, 'unpaid'],
  ['2024-10-25', 'Nhân công cầu thang', 'wbs-stairs', 'labor', 'Đội hoàn thiện số 4', 650000000, 'paid'],
  ['2024-11-16', 'Tạm ứng hoàn thiện', 'wbs-finishing', 'subcontract', 'Nội thất Sao Việt', 2500000000, 'unpaid'],
  ['2024-12-04', 'Hệ thống điện nước', 'wbs-mep', 'subcontract', 'MEP Trường Sơn', 1250000000, 'paid'],
] as const;

const seedCashIn = [
  ['01/2024', 5200000000],
  ['02/2024', 9400000000],
  ['03/2024', 12800000000],
  ['04/2024', 16800000000],
  ['05/2024', 22000000000],
  ['06/2024', 23500000000],
  ['07/2024', 23000000000],
  ['08/2024', 29500000000],
  ['09/2024', 35500000000],
  ['10/2024', 36000000000],
  ['11/2024', 33000000000],
  ['12/2024', 38500000000],
  ['01/2025', 39800000000],
] as const;

function setStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getStorage<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function ensureDashboardData() {
  const projects = getProjects();
  let project = projects.find((item) => item.id === PROJECT_ID);

  if (!project) {
    const created = addProject('Cao ốc văn phòng ABC', 'Công ty TNHH ABC', 50000000000, 'in_progress');
    project = created.data;
    if (project) {
      const existing = getProjects().filter((item) => item.id !== project!.id);
      setStorage('construction_erp_projects', [
        {
          ...project,
          id: PROJECT_ID,
          start_date: '2024-01-01',
          end_date: '2025-12-31',
          created_at: '2024-01-01T08:00:00Z',
        },
        ...existing,
      ]);
    }
  } else if (!project.start_date || !project.end_date || project.name !== 'Cao ốc văn phòng ABC') {
    updateProject(PROJECT_ID, {
      name: 'Cao ốc văn phòng ABC',
      investor: 'Công ty TNHH ABC',
      total_value: 50000000000,
      status: 'in_progress',
      start_date: '2024-01-01',
      end_date: '2025-12-31',
    });
  }

  if (getWBS(PROJECT_ID).length === 0) {
    seedWbs.forEach((item) => addWBS(PROJECT_ID, item.name, item.parent));
    setStorage(
      `construction_erp_wbs_${PROJECT_ID}`,
      seedWbs.map((item, index) => ({
        id: item.id,
        project_id: PROJECT_ID,
        name: item.name,
        parent_id: item.parent,
        children: [],
        created_at: new Date(Date.UTC(2024, 0, index + 1, 8)).toISOString(),
      })),
    );
  }

  if (getBudget(PROJECT_ID).length === 0) {
    seedBudget.forEach(([wbsId, costType, amount]) => {
      addBudget(PROJECT_ID, wbsId, costType, amount);
    });
  }

  if (getCosts(PROJECT_ID).length === 0) {
    seedCosts.forEach(([date, note, wbsId, costType, supplier, amount, status]) => {
      addCost(PROJECT_ID, wbsId, costType, amount, 0, 0, supplier, note, date, status);
    });
  }

  if (!localStorage.getItem(REVENUE_KEY)) {
    setStorage(REVENUE_KEY, 25600000000);
  }

  if (!localStorage.getItem(RECEIVABLE_KEY)) {
    setStorage<DebtSummary>(RECEIVABLE_KEY, {
      total: 12800000000,
      paid: 8200000000,
      remaining: 4600000000,
      overdue: 850000000,
    });
  }
}

function descendants(items: WBSItem[], id: string): string[] {
  const children = items.filter((item) => item.parent_id === id);
  return children.flatMap((child) => [child.id, ...descendants(items, child.id)]);
}

function sumForWbs<T extends { wbs_id: string }>(items: WBSItem[], rows: T[], id: string, getValue: (row: T) => number) {
  const ids = new Set([id, ...descendants(items, id)]);
  return rows.filter((row) => ids.has(row.wbs_id)).reduce((sum, row) => sum + getValue(row), 0);
}

function mapWbsRows(nodes: WBSTreeNode[], items: WBSItem[], budget: BudgetRecord[], costs: CostRecord[]): WBSBudgetRow[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    level: node.level,
    budget: sumForWbs(items, budget, node.id, (row) => row.estimated_amount),
    actual: sumForWbs(items, costs, node.id, (row) => row.amount),
    children: mapWbsRows(node.children as WBSTreeNode[], items, budget, costs),
  }));
}

function makeCashFlow(costs: CostRecord[]): CashFlowPoint[] {
  return seedCashIn.map(([month, income]) => {
    const [monthPart, yearPart] = month.split('/');
    const expense = costs
      .filter((cost) => cost.date.startsWith(`${yearPart}-${monthPart}`))
      .reduce((sum, cost) => sum + cost.amount, 0);
    return { month, income, expense };
  });
}

export function loadDashboardData(): DashboardData {
  ensureDashboardData();

  const project = getProjects().find((item) => item.id === PROJECT_ID) ?? getProjects()[0];
  const budget = getBudget(PROJECT_ID);
  const costs = getCosts(PROJECT_ID);
  const wbsItems = getWBS(PROJECT_ID);
  const wbsTree = buildWBSTree(PROJECT_ID);
  const revenue = getStorage(REVENUE_KEY, 0);
  const receivable = getStorage<DebtSummary>(RECEIVABLE_KEY, { total: 0, paid: 0, remaining: 0, overdue: 0 });
  const payableTotal = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const payablePaid = costs.filter((cost) => cost.status === 'paid').reduce((sum, cost) => sum + cost.amount, 0);
  const payableRemaining = payableTotal - payablePaid;
  const payable: DebtSummary = {
    total: payableTotal,
    paid: payablePaid,
    remaining: payableRemaining,
    overdue: costs.filter((cost) => cost.status === 'unpaid' && cost.date < '2024-06-20').reduce((sum, cost) => sum + cost.amount, 0),
  };
  const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
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
    budget,
    costs,
    wbsTree,
    revenue,
    receivable,
    payable,
    costByType: costByType.map((row) => ({ ...row, value: row.value || totalCost * 0.001 })),
    cashFlow: makeCashFlow(costs),
    wbsRows: mapWbsRows(wbsTree, wbsItems, budget, costs),
    progress: 56,
    daysElapsed,
    durationDays,
  };
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

export function formatShortVnd(value: number) {
  if (value >= 1000000000) return `${formatVnd(value / 1000000000)}B`;
  if (value >= 1000000) return `${formatVnd(value / 1000000)}M`;
  return formatVnd(value);
}

export function formatDate(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
}
