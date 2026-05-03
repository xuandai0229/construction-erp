import { useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';

export function useWBS(projectId: string | null) {
  const wbsItems = useERPStore(state => state.wbs);
  const budgets = useERPStore(state => state.budgets);
  const costs = useERPStore(state => state.costs);
  const isInitialized = useERPStore(state => state.initialized);
  const getWBSTreeWithCost = useERPStore(state => state.getWBSTreeWithCost);
  
  const addWBSAction = useERPStore(state => state.addWBS);
  const updateWBSAction = useERPStore(state => state.updateWBS);
  const deleteWBSAction = useERPStore(state => state.deleteWBS);

  const { tree, stats } = useMemo(() => {
    if (!isInitialized || !projectId) {
      return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };
    }
    return getWBSTreeWithCost();
  }, [wbsItems, budgets, costs, isInitialized, projectId, getWBSTreeWithCost]);

  const addWBS = (name: string, parentId: string | null = null) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    return addWBSAction(projectId, name, parentId);
  };

  const updateWBS = (wbsId: string, updates: Partial<Pick<import('@/app/types').WBSItem, 'name' | 'parent_id'>>) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    return updateWBSAction(projectId, wbsId, updates);
  };

  const deleteWBS = (wbsId: string) => {
    if (!projectId) return { success: false, error: 'No project selected' };
    return deleteWBSAction(projectId, wbsId);
  };

  return { 
    wbsItems, 
    wbsTree: tree, 
    stats,
    addWBS,
    updateWBS,
    deleteWBS,
    isInitialized 
  };
}
