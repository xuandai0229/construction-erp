
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useActionCenterQuery() {
  return useQuery({
    queryKey: ['workspace', 'action-center'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/action-center');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ['workspace', 'notifications'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/notifications');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { action: 'READ' | 'READ_ALL', id?: string }) => {
      const res = await fetch('/api/workspace/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'notifications'] });
    }
  });
}

export function useExecutiveSummaryQuery(projectId?: string) {
  return useQuery({
    queryKey: ['workspace', 'executive-summary', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/workspace/executive-summary${projectId ? `?projectId=${projectId}` : ''}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 60000,
  });
}
