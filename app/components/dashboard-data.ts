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
  overdue: number;
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

export function ensureDashboardData() {
  // Logic removed to ensure real data only
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

export function formatShortVnd(value: number) {
  if (value >= 1000000000) return `${formatVnd(value / 1000000000)}B`;
  if (value >= 1000000) return `${formatVnd(value / 1000000)}M`;
  return formatVnd(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '--';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

