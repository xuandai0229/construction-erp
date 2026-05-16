import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wbsApi } from '@/services/api/wbs.api';
import { queryKeys } from '@/lib/query-keys';
import { WBSItem } from '@/app/types';

export function useWBSQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.wbs.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return { flat: [], tree: [], stats: {} };
      const res = await wbsApi.getByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch WBS');
      return res.data || { flat: [], tree: [], stats: {} };
    },
    enabled: !!projectId,
  });
}

export function useCreateWBSMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<WBSItem>) => {
      const res = await wbsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create WBS');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useUpdateWBSMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WBSItem> }) => {
      const res = await wbsApi.update(id, updates);
      if (!res.success) throw new Error(res.error || 'Failed to update WBS');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useDeleteWBSMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await wbsApi.delete(id);
      if (!res.success) {
        const err: any = new Error(res.error || 'Failed to delete WBS');
        err.metadata = res.metadata;
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}
