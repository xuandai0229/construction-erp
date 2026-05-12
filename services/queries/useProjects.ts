import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import { queryKeys } from '@/lib/query-keys';
import { Project } from '@/app/types';

export function useProjectsQuery(params: any = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(JSON.stringify(params)),
    queryFn: async () => {
      const res = await projectApi.getAll(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch projects');
      return res.data?.data || [];
    },
  });
}

export function useProjectStatsQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'stats'],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await projectApi.getStats(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch stats');
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject: Partial<Project>) => {
      const res = await projectApi.create(newProject);
      if (!res.success) throw new Error(res.error || 'Failed to create project');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const res = await projectApi.update(id, updates);
      if (!res.success) throw new Error(res.error || 'Failed to update project');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await projectApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete project');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
