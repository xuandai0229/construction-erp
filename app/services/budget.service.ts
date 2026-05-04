"use server";

import { BudgetRecord, BudgetResponse, CostType, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all budget records for a project
 */
export async function getBudget(projectId: string): Promise<ServiceResponse<BudgetRecord[]>> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('[SERVICE ERROR] getBudget:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as BudgetRecord[] || [] };
}

/**
 * Add a new budget record
 */
export async function addBudget(
  projectId: string,
  wbsId: string,
  costType: CostType,
  estimatedAmount: number
): Promise<ServiceResponse<BudgetRecord>> {
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
    console.error('[SERVICE ERROR] addBudget:', error.message);
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
): Promise<ServiceResponse<BudgetRecord>> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', budgetId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateBudget:', error.message);
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
export async function deleteBudget(projectId: string, budgetId: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('project_id', projectId);

  if (error) {
    console.error('[SERVICE ERROR] deleteBudget:', error.message);
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
}): Promise<ServiceResponse<BudgetRecord>> {
  return addBudget(data.projectId, data.wbsId, data.costType, data.estimatedAmount);
}
