"use server";
import { Project, ProjectResponse, ProjectStatus, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all projects from Supabase
 */
export async function getProjects(): Promise<ServiceResponse<Project[]>> {
  console.log('[DEBUG] getProjects running on server. Client URL:', (supabase as any).supabaseUrl);
  // @ts-ignore
  console.log('[DEBUG] Client Key starts with:', (supabase as any).supabaseKey?.substring(0, 10));
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SERVICE ERROR] getProjects:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as Project[] || [] };
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<ServiceResponse<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[SERVICE ERROR] getProject:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as Project };
}

/**
 * Add a new project
 */
export async function addProject(
  name: string,
  investor: string = '',
  contract_value: number = 0,
  status: ProjectStatus = 'planning'
): Promise<ServiceResponse<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        name,
        investor,
        total_value: contract_value,
        status
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] addProject:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as Project,
  };
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'created_at'>>
): Promise<ServiceResponse<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateProject:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as Project,
  };
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SERVICE ERROR] deleteProject:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
