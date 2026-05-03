// ============================================
// BUDGET SERVICE - SUPABASE DATA LAYER
// ============================================

import { BudgetRecord, BudgetResponse, CostType } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all budget records for a project
 */
export async function getBudget(projectId: string): Promise<BudgetRecord[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  return data as BudgetRecord[];
}

/**
 * Add a new budget record
 */
export async function addBudget(
  projectId: string,
  wbsId: string,
  costType: CostType,
  estimatedAmount: number
): Promise<BudgetResponse> {
  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        project_id: projectId,
        wbs_id: wbsId,
        cost_type: costType,
        estimated_amount: estimatedAmount
      }
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as BudgetRecord,
  };
}

/**
 * Update an existing budget record
 */
export async function updateBudget(
  projectId: string,
  budgetId: string,
  updates: Partial<Omit<BudgetRecord, 'id' | 'project_id' | 'created_at'>>
): Promise<BudgetResponse> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', budgetId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as BudgetRecord,
  };
}

/**
 * Delete a budget record
 */
export async function deleteBudget(projectId: string, budgetId: string): Promise<BudgetResponse> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('project_id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create a budget record with full data object (Legacy wrapper)
 */
export async function createBudget(data: {
  projectId: string;
  wbsId: string;
  costType: CostType;
  estimatedAmount: number;
}): Promise<BudgetResponse> {
  return addBudget(data.projectId, data.wbsId, data.costType, data.estimatedAmount);
}
