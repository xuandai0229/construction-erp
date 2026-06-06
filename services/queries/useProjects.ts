import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import { queryKeys } from '@/lib/query-keys';
import { Project } from '@/app/types';

export function useProjectsQuery(params: any = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(JSON.stringify(params)),
    queryFn: async () => {
      const res = await projectApi.getAll(params);
      if (!res.success) throw new Error(res.error || 'Không thể tải danh sách công trình.');
      return res.data; // Return { data, metadata }
    },
    placeholderData: keepPreviousData,
  });
}

export function useProjectStatsQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'stats'],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await projectApi.getStats(projectId);
      if (!res.success) throw new Error(res.error || 'Không thể tải chỉ tiêu công trình.');
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
      if (!res.success) throw new Error(res.error || 'Không thể tạo công trình.');
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
      if (!res.success) throw new Error(res.error || 'Không thể cập nhật công trình.');
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
      if (!res.success) {
        const err: any = new Error(res.error || 'Không thể xóa công trình.');
        err.metadata = res.metadata;
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
