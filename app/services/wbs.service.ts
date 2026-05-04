"use server";

import { WBSItem, WBSTreeNode, WBSResponse, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all WBS items for a project from Supabase
 */
export async function getWBS(projectId: string): Promise<ServiceResponse<WBSItem[]>> {
  const { data, error } = await supabase
    .from('wbs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[SERVICE ERROR] getWBS:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as WBSItem[] || [] };
}

/**
 * Add a new WBS item
 */
export async function addWBS(
  projectId: string,
  name: string,
  parentId: string | null = null
): Promise<ServiceResponse<WBSItem>> {
  const { data, error } = await supabase
    .from('wbs')
    .insert([
      {
        project_id: projectId,
        name,
        parent_id: parentId
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] addWBS:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as WBSItem,
  };
}

/**
 * Update an existing WBS item
 */
export async function updateWBS(
  projectId: string,
  wbsId: string,
  updates: Partial<Pick<WBSItem, 'name' | 'parent_id'>>
): Promise<ServiceResponse<WBSItem>> {
  const { data, error } = await supabase
    .from('wbs')
    .update(updates)
    .eq('id', wbsId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateWBS:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as WBSItem,
  };
}

/**
 * Delete a WBS item
 */
export async function deleteWBS(projectId: string, wbsId: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('wbs')
    .delete()
    .eq('id', wbsId)
    .eq('project_id', projectId);

  if (error) {
    console.error('[SERVICE ERROR] deleteWBS:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

