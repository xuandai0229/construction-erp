"use server";

import { CostRecord, CostResponse, CostType, CostStatus, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all costs for a project from Supabase
 */
export async function getCosts(projectId: string): Promise<ServiceResponse<CostRecord[]>> {
  const { data, error } = await supabase
    .from('costs')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[SERVICE ERROR] getCosts:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as CostRecord[] || [] };
}

/**
 * Add a new cost record
 */
export async function addCost(
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
): Promise<ServiceResponse<CostRecord>> {
  const { data, error } = await supabase
    .from('costs')
    .insert([
      {
        project_id: projectId,
        wbs_id: wbsId,
        cost_type: costType,
        amount,
        quantity,
        unit_price: unitPrice,
        supplier,
        note,
        date,
        status,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] addCost:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as CostRecord,
  };
}

/**
 * Update an existing cost record
 */
export async function updateCost(
  projectId: string,
  costId: string,
  updates: Partial<Omit<CostRecord, 'id' | 'project_id' | 'created_at'>>
): Promise<ServiceResponse<CostRecord>> {
  const { data, error } = await supabase
    .from('costs')
    .update(updates)
    .eq('id', costId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateCost:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as CostRecord,
  };
}

/**
 * Delete a cost record
 */
export async function deleteCost(projectId: string, costId: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('costs')
    .delete()
    .eq('id', costId)
    .eq('project_id', projectId);

  if (error) {
    console.error('[SERVICE ERROR] deleteCost:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create a cost record with full data object (Legacy wrapper)
 */
export async function createCost(costData: {
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
}): Promise<ServiceResponse<CostRecord>> {
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
