// ============================================
// PROJECT SERVICE - SUPABASE DATA LAYER
// ============================================

import { Project, ProjectResponse, ProjectStatus } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all projects from Supabase
 */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data as Project[];
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return data as Project;
}

/**
 * Add a new project
 */
export async function addProject(
  name: string,
  investor: string = '',
  contract_value: number = 0,
  status: ProjectStatus = 'planning'
): Promise<ProjectResponse> {
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
): Promise<ProjectResponse> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
export async function deleteProject(id: string): Promise<ProjectResponse> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
