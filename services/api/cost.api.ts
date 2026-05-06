import { CostRecord, BudgetRecord, ServiceResponse } from '@/app/types';
import { mapCostFromApi, mapBudgetFromApi, mapCostToApi } from '@/lib/mappers/cost.mapper';

export const costApi = {
  async getCostsByProject(projectId: string): Promise<ServiceResponse<CostRecord[]>> {
    const res = await fetch(`/api/costs?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapCostFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getBudgetsByProject(projectId: string): Promise<ServiceResponse<BudgetRecord[]>> {
    const res = await fetch(`/api/budgets?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapBudgetFromApi) };
    }
    return { success: false, error: json.error };
  },

  async createCost(data: Partial<CostRecord>): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapCostToApi(data)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async updateCost(id: string, updates: Partial<CostRecord>): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/costs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapCostToApi(updates)),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async deleteCost(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/costs/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async createBudget(data: any): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: data.projectId,
        wbs_id: data.wbsId,
        cost_type: data.costType,
        estimated_amount: data.estimatedAmount
      }),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async deleteBudget(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  }
};
