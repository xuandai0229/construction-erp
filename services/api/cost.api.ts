import { CostRecord, BudgetRecord, ServiceResponse } from '@/app/types';
import { mapCostFromApi, mapBudgetFromApi, mapCostToApi } from '@/lib/mappers/cost.mapper';

export const costApi = {
  async getCostsByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<CostRecord[]>> {
    const res = await fetch(`/api/costs?projectId=${projectId}`, { headers });
    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `API Error (${res.status}): ${errorText.substring(0, 100)}` };
    }
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapCostFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getBudgetsByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<BudgetRecord[]>> {
    const res = await fetch(`/api/budgets?projectId=${projectId}`, { headers });
    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `API Error (${res.status}): ${errorText.substring(0, 100)}` };
    }
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapBudgetFromApi) };
    }
    return { success: false, error: json.error };
  },

  async createCost(data: any, headers: any = {}): Promise<ServiceResponse<CostRecord>> {
    const res = await fetch('/api/costs', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapCostToApi(data)),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async updateCost(id: string, updates: Partial<CostRecord>, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/costs/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(mapCostToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async transitionCost(id: string, status: string, reason?: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/costs/${id}/approve`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    const json = await res.json();
    return { success: json.success, error: json.error, metadata: json.metadata };
  },

  async deleteCost(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/costs/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error, metadata: json.metadata };
  },

  async createBudget(data: any, headers: any = {}): Promise<ServiceResponse<BudgetRecord>> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async deleteBudget(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error, metadata: json.metadata };
  }
};
