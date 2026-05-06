import { useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';
import { CostType } from '@/app/types';

export function useBudget(projectId: string | null) {
  const budgets = useERPStore(state => state.budgets);
  const isInitialized = useERPStore(state => state.initialized);
  const addBudgetAction = useERPStore(state => state.addBudget);

  const filteredBudgets = useMemo(() => {
    if (!projectId) return [];
    return budgets.filter(b => b.projectId === projectId);
  }, [budgets, projectId]);

  const addBudget = (wbsId: string, costType: CostType, estimatedAmount: number) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    return addBudgetAction(projectId, wbsId, costType, estimatedAmount);
  };

  return { 
    budgets: filteredBudgets, 
    addBudget,
    isInitialized 
  };
}

