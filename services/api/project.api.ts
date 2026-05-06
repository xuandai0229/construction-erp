import { Project, ServiceResponse } from '@/app/types';
import { mapProjectFromApi, mapProjectToApi } from '@/lib/mappers/project.mapper';
import { mapStatsFromApi } from '@/lib/mappers/finance.mapper';

export const projectApi = {
  async getAll(): Promise<ServiceResponse<Project[]>> {
    const res = await fetch('/api/projects');
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: json.data.map(mapProjectFromApi)
      };
    }
    return { success: false, error: json.error };
  },

  async create(data: Partial<Project>): Promise<ServiceResponse<Project>> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapProjectToApi(data)),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: mapProjectFromApi(json.data) };
    }
    return { success: false, error: json.error };
  },

  async update(id: string, updates: Partial<Project>): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapProjectToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async getStats(projectId: string): Promise<ServiceResponse<any>> {
    const res = await fetch(`/api/dashboard/stats?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: mapStatsFromApi(json.data)
      };
    }
    return json;
  }
};
