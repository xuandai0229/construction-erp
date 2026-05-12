import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Budget } from '@/app/types';

export function useBudgetsQuery(projectId: string) {
  return useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/budgets?projectId=${projectId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch budgets');
      return json.data as Budget[];
    },
    enabled: !!projectId,
  });
}

export function useCreateBudgetMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Budget>) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create budget');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
    },
  });
}
