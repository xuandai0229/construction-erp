// ============================================
// PROJECT SERVICE - DATA LAYER
// Uses localStorage for temporary storage
// Architecture ready for Supabase switch
// ============================================

import { Project, ProjectResponse, ProjectStatus } from '@/app/types';

// Storage key
const PROJECTS_KEY = 'construction_erp_projects';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all projects from storage
 */
export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Get a single project by ID
 */
export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

/**
 * Add a new project
 */
export function addProject(
  name: string,
  investor: string = '',
  total_value: number = 0,
  status: ProjectStatus = 'planning'
): ProjectResponse {
  try {
    const projects = getProjects();
    
    const newProject: Project = {
      id: generateId(),
      name,
      investor,
      total_value,
      status,
      created_at: new Date().toISOString(),
    };

    projects.push(newProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    return {
      success: true,
      data: newProject,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing project
 */
export function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'created_at'>>
): ProjectResponse {
  try {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    projects[index] = {
      ...projects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    return {
      success: true,
      data: projects[index],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a project
 */
export function deleteProject(id: string): ProjectResponse {
  try {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);

    if (filtered.length === projects.length) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));

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
 * Initialize sample data (for demo purposes)
 */
export function initSampleData(): void {
  const existing = getProjects();
  if (existing.length > 0) return;

  const sampleProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Tòa nhà văn phòng HP',
      investor: 'Công ty HP Việt Nam',
      total_value: 50000000000,
      status: 'in_progress',
      created_at: '2024-01-15T08:00:00Z',
    },
    {
      id: 'proj-2',
      name: 'Căn hộ cao cấp Sunrise',
      investor: 'Công ty BĐS Sunrise',
      total_value: 120000000000,
      status: 'planning',
      created_at: '2024-02-01T10:00:00Z',
    },
    {
      id: 'proj-3',
      name: 'Nhà máy sản xuất ABC',
      investor: 'Tập đoàn ABC',
      total_value: 80000000000,
      status: 'completed',
      created_at: '2023-11-20T14:00:00Z',
    },
  ];

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(sampleProjects));
}
