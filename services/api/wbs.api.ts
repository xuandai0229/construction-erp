import { WBSItem, ServiceResponse } from '@/app/types';
import { mapWBSFromApi, mapWBSToApi } from '@/lib/mappers/wbs.mapper';

export const wbsApi = {
  async getByProject(projectId: string): Promise<ServiceResponse<{ tree: any[], flat: WBSItem[], stats: any }>> {
    const res = await fetch(`/api/wbs?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: {
          tree: json.data.tree, // Mapping tree is complex, let's assume it's mapped or the mapper handles objects
          flat: json.data.flat.map(mapWBSFromApi),
          stats: json.data.stats
        }
      };
    }
    return { success: false, error: json.error };
  },

  async create(data: Partial<WBSItem>): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/wbs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapWBSToApi(data)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async update(id: string, updates: Partial<WBSItem>): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/wbs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapWBSToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async delete(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/wbs/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  }
};
