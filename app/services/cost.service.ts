// ============================================
// COST SERVICE - COST MANAGEMENT LAYER
// Uses localStorage for data persistence
// Architecture ready for Supabase switch
// ============================================

import {
  CostRecord,
  CostType,
  CostStatus,
  CostResponse,
  CostSummaryByType,
  CostSummaryByWBS,
  BudgetVariance,
} from '@/app/types';
import { getWBS } from './wbs.service';

// Storage key pattern: costs_{project_id}
function getCostsKey(projectId: string): string {
  return `construction_erp_costs_${projectId}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all cost records for a project
 */
export function getCosts(projectId: string): CostRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getCostsKey(projectId));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Add a new cost record
 */
export function addCost(
  projectId: string,
  wbsId: string,
  costType: CostType,
  amount: number,
  quantity: number = 0,
  unitPrice: number = 0,
  supplier: string = '',
  note: string = '',
  date: string = new Date().toISOString().split('T')[0],
  status: CostStatus = 'unpaid'
): CostResponse {
  try {
    // Calculate final amount
    let finalAmount = amount;
    if (quantity > 0 && unitPrice > 0) {
      finalAmount = quantity * unitPrice;
    } else if (amount > 0 && unitPrice > 0) {
      finalAmount = amount * unitPrice;
    }

    const costs = getCosts(projectId);

    const newCost: CostRecord = {
      id: generateId(),
      project_id: projectId,
      wbs_id: wbsId,
      cost_type: costType,
      amount: finalAmount,
      quantity,
      unit_price: unitPrice,
      supplier,
      note,
      date,
      status,
      created_at: new Date().toISOString(),
    };

    costs.push(newCost);
    localStorage.setItem(getCostsKey(projectId), JSON.stringify(costs));

    return {
      success: true,
      data: newCost,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a cost record
 */
export function updateCost(
  projectId: string,
  costId: string,
  updates: Partial<Omit<CostRecord, 'id' | 'project_id' | 'created_at'>>
): CostResponse {
  try {
    const costs = getCosts(projectId);
    const index = costs.findIndex(c => c.id === costId);

    if (index === -1) {
      return {
        success: false,
        error: 'Cost record not found',
      };
    }

    // Recalculate amount if quantity or unit_price changed
    const updated = { ...costs[index], ...updates };
    if (updated.quantity > 0 && updated.unit_price > 0) {
      updated.amount = updated.quantity * updated.unit_price;
    }

    costs[index] = updated;
    localStorage.setItem(getCostsKey(projectId), JSON.stringify(costs));

    return {
      success: true,
      data: costs[index],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a cost record
 */
export function deleteCost(projectId: string, costId: string): CostResponse {
  try {
    const costs = getCosts(projectId);
    const filtered = costs.filter(c => c.id !== costId);

    if (filtered.length === costs.length) {
      return {
        success: false,
        error: 'Cost record not found',
      };
    }

    localStorage.setItem(getCostsKey(projectId), JSON.stringify(filtered));

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
 * Get costs filtered by WBS item
 */
export function getCostsByWBS(projectId: string, wbsId: string): CostRecord[] {
  const costs = getCosts(projectId);
  return costs.filter(c => c.wbs_id === wbsId);
}

/**
 * Get total cost for a project
 */
export function getTotalCostByProject(projectId: string): number {
  const costs = getCosts(projectId);
  return costs.reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Get total cost for a WBS item (including children)
 */
export function getTotalCostByWBS(projectId: string, wbsId: string): number {
  const costs = getCosts(projectId);
  const wbsItems = getWBS(projectId);

  // Get all descendant WBS IDs
  const getDescendantIds = (parentId: string): string[] => {
    const children = wbsItems.filter(item => item.parent_id === parentId);
    let ids: string[] = [];
    children.forEach(child => {
      ids.push(child.id);
      ids = ids.concat(getDescendantIds(child.id));
    });
    return ids;
  };

  const targetIds = new Set([wbsId, ...getDescendantIds(wbsId)]);
  return costs
    .filter(c => targetIds.has(c.wbs_id))
    .reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Get cost summary grouped by type
 */
export function getCostSummaryByType(projectId: string): CostSummaryByType[] {
  const costs = getCosts(projectId);
  const summaryMap = new Map<CostType, CostSummaryByType>();

  const costTypes: CostType[] = [
    'material',
    'labor',
    'machine',
    'subcontract',
    'overhead',
    'other',
  ];

  // Initialize all types
  costTypes.forEach(type => {
    summaryMap.set(type, {
      cost_type: type,
      total: 0,
      count: 0,
      paid: 0,
      unpaid: 0,
    });
  });

  // Aggregate costs
  costs.forEach(cost => {
    const summary = summaryMap.get(cost.cost_type)!;
    summary.total += cost.amount;
    summary.count += 1;
    if (cost.status === 'paid') {
      summary.paid += cost.amount;
    } else {
      summary.unpaid += cost.amount;
    }
  });

  return Array.from(summaryMap.values());
}

/**
 * Get cost summary grouped by WBS
 */
export function getCostSummaryByWBS(projectId: string): CostSummaryByWBS[] {
  const costs = getCosts(projectId);
  const wbsItems = getWBS(projectId);
  const summaryMap = new Map<string, CostSummaryByWBS>();

  // Initialize with all WBS items
  wbsItems.forEach(item => {
    summaryMap.set(item.id, {
      wbs_id: item.id,
      wbs_name: item.name,
      total: 0,
      count: 0,
    });
  });

  // Aggregate costs
  costs.forEach(cost => {
    const summary = summaryMap.get(cost.wbs_id);
    if (summary) {
      summary.total += cost.amount;
      summary.count += 1;
    }
  });

  return Array.from(summaryMap.values()).filter(s => s.count > 0);
}

/**
 * Get variance between budget and actual
 */
export function getBudgetVariance(
  projectId: string,
  budgetData: { wbsId: string; costType: CostType; estimatedAmount: number }[]
): BudgetVariance[] {
  const costs = getCosts(projectId);
  const wbsItems = getWBS(projectId);

  // Build WBS name map
  const wbsNameMap = new Map<string, string>();
  wbsItems.forEach(item => {
    wbsNameMap.set(item.id, item.name);
  });

  // Group actual costs by wbs_id and cost_type
  const actualMap = new Map<string, number>();
  costs.forEach(cost => {
    const key = `${cost.wbs_id}_${cost.cost_type}`;
    actualMap.set(key, (actualMap.get(key) || 0) + cost.amount);
  });

  // Calculate variances
  const variances: BudgetVariance[] = [];

  budgetData.forEach(budget => {
    const key = `${budget.wbsId}_${budget.costType}`;
    const actual = actualMap.get(key) || 0;
    const planned = budget.estimatedAmount;
    const variance = actual - planned;
    const percentage = planned > 0 ? (variance / planned) * 100 : 0;

    variances.push({
      wbs_id: budget.wbsId,
      wbs_name: wbsNameMap.get(budget.wbsId) || budget.wbsId,
      cost_type: budget.costType,
      planned,
      actual,
      variance,
      percentage,
    });
  });

  return variances;
}

/**
 * Create a cost record with full data object
 */
export function createCost(costData: {
  projectId: string;
  wbsId: string;
  costType: CostType;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  supplier?: string;
  note?: string;
  date?: string;
  status?: CostStatus;
}): CostResponse {
  return addCost(
    costData.projectId,
    costData.wbsId,
    costData.costType,
    costData.amount,
    costData.quantity || 0,
    costData.unitPrice || 0,
    costData.supplier || '',
    costData.note || '',
    costData.date || new Date().toISOString().split('T')[0],
    costData.status || 'unpaid'
  );
}
