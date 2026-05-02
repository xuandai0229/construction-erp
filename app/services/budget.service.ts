// ============================================
// BUDGET SERVICE - BUDGET MANAGEMENT LAYER
// Uses localStorage for data persistence
// Architecture ready for Supabase switch
// ============================================

import {
  BudgetRecord,
  BudgetResponse,
  CostType,
} from '@/app/types';

// Storage key pattern: budget_{project_id}
function getBudgetKey(projectId: string): string {
  return `construction_erp_budget_${projectId}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all budget records for a project
 */
export function getBudget(projectId: string): BudgetRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getBudgetKey(projectId));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Add a new budget item
 */
export function addBudget(
  projectId: string,
  wbsId: string,
  costType: CostType,
  estimatedAmount: number
): BudgetResponse {
  try {
    const budget = getBudget(projectId);

    const newBudget: BudgetRecord = {
      id: generateId(),
      project_id: projectId,
      wbs_id: wbsId,
      cost_type: costType,
      estimated_amount: estimatedAmount,
      created_at: new Date().toISOString(),
    };

    budget.push(newBudget);
    localStorage.setItem(getBudgetKey(projectId), JSON.stringify(budget));

    return {
      success: true,
      data: newBudget,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a budget record
 */
export function updateBudget(
  projectId: string,
  budgetId: string,
  updates: Partial<Omit<BudgetRecord, 'id' | 'project_id' | 'created_at'>>
): BudgetResponse {
  try {
    const budget = getBudget(projectId);
    const index = budget.findIndex(b => b.id === budgetId);

    if (index === -1) {
      return {
        success: false,
        error: 'Budget record not found',
      };
    }

    budget[index] = {
      ...budget[index],
      ...updates,
    };

    localStorage.setItem(getBudgetKey(projectId), JSON.stringify(budget));

    return {
      success: true,
      data: budget[index],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a budget record
 */
export function deleteBudget(projectId: string, budgetId: string): BudgetResponse {
  try {
    const budget = getBudget(projectId);
    const filtered = budget.filter(b => b.id !== budgetId);

    if (filtered.length === budget.length) {
      return {
        success: false,
        error: 'Budget record not found',
      };
    }

    localStorage.setItem(getBudgetKey(projectId), JSON.stringify(filtered));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get budget items filtered by WBS item
 */
export function getBudgetByWBS(projectId: string, wbsId: string): BudgetRecord[] {
  const budget = getBudget(projectId);
  return budget.filter(b => b.wbs_id === wbsId);
}

/**
 * Get total budget for a project
 */
export function getTotalBudget(projectId: string): number {
  const budget = getBudget(projectId);
  return budget.reduce((sum, b) => sum + b.estimated_amount, 0);
}

/**
 * Get budget grouped by WBS
 */
export function getBudgetSummaryByWBS(
  projectId: string
): { wbsId: string; wbsName: string; total: number }[] {
  const budget = getBudget(projectId);
  const summaryMap = new Map<string, { wbsId: string; wbsName: string; total: number }>();

  budget.forEach(b => {
    const existing = summaryMap.get(b.wbs_id);
    if (existing) {
      existing.total += b.estimated_amount;
    } else {
      summaryMap.set(b.wbs_id, {
        wbsId: b.wbs_id,
        wbsName: b.wbs_id,
        total: b.estimated_amount,
      });
    }
  });

  return Array.from(summaryMap.values());
}

/**
 * Get budget grouped by cost type
 */
export function getBudgetSummaryByType(
  projectId: string
): { costType: CostType; total: number }[] {
  const budget = getBudget(projectId);
  const summaryMap = new Map<CostType, number>();

  const costTypes: CostType[] = [
    'material',
    'labor',
    'machine',
    'subcontract',
    'overhead',
    'other',
  ];

  costTypes.forEach(type => summaryMap.set(type, 0));

  budget.forEach(b => {
    summaryMap.set(b.cost_type, (summaryMap.get(b.cost_type) || 0) + b.estimated_amount);
  });

  return Array.from(summaryMap.entries()).map(([costType, total]) => ({
    costType,
    total,
  }));
}

/**
 * Create a budget record with full data object
 */
export function createBudget(data: {
  projectId: string;
  wbsId: string;
  costType: CostType;
  estimatedAmount: number;
}): BudgetResponse {
  return addBudget(data.projectId, data.wbsId, data.costType, data.estimatedAmount);
}
