"use server";

import { RevenueRecord, RevenueResponse, RevenueStatus, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all revenues for a project from Supabase
 */
export async function getRevenues(projectId: string): Promise<ServiceResponse<RevenueRecord[]>> {
  const { data, error } = await supabase
    .from('revenues')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[SERVICE ERROR] getRevenues:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as RevenueRecord[] || [] };
}

/**
 * Add a new revenue record
 */
export async function addRevenue(
  projectId: string,
  wbsId: string,
  amount: number,
  status: RevenueStatus,
  description: string,
  date: string,
  invoice_id?: string
): Promise<ServiceResponse<RevenueRecord>> {
  const { data, error } = await supabase
    .from('revenues')
    .insert([
      {
        project_id: projectId,
        wbs_id: wbsId,
        amount,
        status,
        description,
        date,
        invoice_id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] addRevenue:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as RevenueRecord,
  };
}

/**
 * Update an existing revenue record
 */
export async function updateRevenue(
  projectId: string,
  id: string,
  updates: Partial<Omit<RevenueRecord, 'id' | 'project_id' | 'created_at'>>
): Promise<ServiceResponse<RevenueRecord>> {
  const { data, error } = await supabase
    .from('revenues')
    .update(updates)
    .eq('id', id)
    .eq('project_id', projectId) // 🔒 Prevent cross-project updates
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateRevenue:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as RevenueRecord,
  };
}

/**
 * Delete a revenue record
 */
export async function deleteRevenue(id: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SERVICE ERROR] deleteRevenue:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create a revenue record (Legacy wrapper)
 */
export async function createRevenue(params: {
  project_id: string;
  wbs_id: string;
  amount: number;
  status: RevenueStatus;
  description: string;
  date: string;
  invoice_id?: string;
}): Promise<ServiceResponse<RevenueRecord>> {
  return addRevenue(
    params.project_id,
    params.wbs_id,
    params.amount,
    params.status,
    params.description,
    params.date,
    params.invoice_id
  );
}
