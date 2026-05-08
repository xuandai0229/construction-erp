'use client';

import { BudgetRecord, CostRecord, CostType, Project, WBSItem, WBSTreeNode } from '@/app/types';

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
  overdueCount: number;
};

export type WBSBudgetRow = {
  id: string;
  name: string;
  level: number;
  budget: number;
  actual: number;
  profit: number;
  children: WBSBudgetRow[];
};

export type DashboardData = {
  project: Project;
  totalBudget: number;
  totalActual: number;
  budget: BudgetRecord[];
  costs: CostRecord[];
  wbsTree: WBSTreeNode[];
  revenue: number;
  receivable: DebtSummary;
  payable: DebtSummary;
  costByType: CostTypeRow[];
  monthlyTrends: { month: string; revenue: number; cost: number }[];
  wbsRows: WBSBudgetRow[];
  wbs: WBSItem[];
  progress: number;
  daysRemaining: number;
  healthStatus: 'OK' | 'WARNING' | 'CRITICAL';
  healthScore: number;
};

export function ensureDashboardData() {
  // Logic removed to ensure real data only
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

export function formatShortVnd(value: number) {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}T`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Tr`;
  return formatVnd(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
}

