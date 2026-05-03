// ============================================
// REVENUE SERVICE - SUPABASE DATA LAYER
// ============================================

import { RevenueRecord, RevenueResponse, RevenueStatus } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all revenues for a project from Supabase
 */
export async function getRevenues(projectId: string): Promise<RevenueRecord[]> {
  const { data, error } = await supabase
    .from('revenues')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching revenues:', error);
    return [];
  }
  return data as RevenueRecord[];
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
): Promise<RevenueResponse> {
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
  id: string,
  updates: Partial<Omit<RevenueRecord, 'id' | 'project_id' | 'created_at'>>
): Promise<RevenueResponse> {
  const { data, error } = await supabase
    .from('revenues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
export async function deleteRevenue(id: string): Promise<RevenueResponse> {
  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id);

  if (error) {
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
}): Promise<RevenueResponse> {
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
