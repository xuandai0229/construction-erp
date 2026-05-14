import { Project, ServiceResponse } from '@/app/types';
import { mapProjectFromApi, mapProjectToApi } from '@/lib/mappers/project.mapper';
import { mapStatsFromApi } from '@/lib/mappers/finance.mapper';

export const projectApi = {
  async getAll(params: any = {}): Promise<ServiceResponse<{ data: Project[]; metadata: any }>> {
    const cleanParams: any = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`/api/projects?${query}`);
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: {
          data: json.data.map(mapProjectFromApi),
          metadata: json.metadata
        }
      };
    }
    return { success: false, error: json.error };
  },

  async getAllFiltered(params: any = {}): Promise<ServiceResponse<Project[]>> {
    const cleanParams: any = { ...params, limit: 1000, page: 1 }; // High limit for export
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`/api/projects?${query}`);
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: json.data.map(mapProjectFromApi)
      };
    }
    return { success: false, error: json.error };
  },

  async create(data: Partial<Project>, headers: any = {}): Promise<ServiceResponse<Project>> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapProjectToApi(data)),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: mapProjectFromApi(json.data) };
    }
    return { success: false, error: json.error };
  },

  async update(id: string, updates: Partial<Project>, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapProjectToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async delete(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error, metadata: json.metadata };
  },

  async getStats(projectId: string, headers: any = {}): Promise<ServiceResponse<any>> {
    const res = await fetch(`/api/dashboard/stats?projectId=${projectId}`, { headers });
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
