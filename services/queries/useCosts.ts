import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costApi } from '@/services/api/cost.api';
import { queryKeys } from '@/lib/query-keys';
import { CostRecord } from '@/app/types';

export function useCostsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.costs.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await costApi.getCostsByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch costs');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateCostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await costApi.createCost(data);
      if (!res.success) throw new Error(res.error || 'Failed to create cost');
      return res.data;
    },
    onSuccess: (_, variables) => {
      const { projectId } = variables;
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useUpdateCostMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CostRecord> }) => {
      const res = await costApi.updateCost(id, updates);
      if (!res.success) throw new Error(res.error || 'Failed to update cost');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useTransitionCostMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await costApi.transitionCost(id, status, reason);
      if (!res.success) {
        const err: any = new Error(res.error || 'Failed to transition cost');
        err.metadata = res.metadata;
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useDeleteCostMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await costApi.deleteCost(id);
      if (!res.success) {
        const err: any = new Error(res.error || 'Failed to delete cost');
        err.metadata = res.metadata;
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}
