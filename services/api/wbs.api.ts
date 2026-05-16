import { WBSItem, ServiceResponse, WBSTreeNode } from '@/app/types';
import { mapWBSFromApi, mapWBSToApi } from '@/lib/mappers/wbs.mapper';

export const wbsApi = {
  async getByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<{ flat: WBSItem[]; tree: WBSTreeNode[]; stats: any }>> {
    const res = await fetch(`/api/wbs?projectId=${projectId}`, { headers });
    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        data: {
          flat: json.data.flat.map(mapWBSFromApi),
          tree: json.data.tree,
          stats: json.data.stats
        }
      };
    }
    return { success: false, error: json.error };
  },

  async create(data: Partial<WBSItem>, headers: any = {}): Promise<ServiceResponse<WBSItem>> {
    const res = await fetch('/api/wbs', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapWBSToApi(data)),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async update(id: string, updates: Partial<WBSItem>, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/wbs/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapWBSToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async delete(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/wbs/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error, metadata: json.metadata };
  }
};
