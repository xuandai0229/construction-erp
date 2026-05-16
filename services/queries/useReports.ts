import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function useAgingReportQuery(projectId?: string, type: 'receivable' | 'payable' = 'receivable') {
  return useQuery({
    queryKey: [...queryKeys.all, 'reports', 'aging', projectId, type],
    queryFn: async () => {
      const res = await fetch(`/api/reports/aging?projectId=${projectId || ''}&type=${type}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch aging report');
      return json.data;
    },
    enabled: true, // Company-wide if no projectId
  });
}

export function useMonthlyReportQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.all, 'reports', 'monthly', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/reports/monthly?projectId=${projectId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch monthly report');
      return json.data;
    },
    enabled: !!projectId,
  });
}

export function useFiscalPeriodsQuery() {
  return useQuery({
    queryKey: [...queryKeys.all, 'reports', 'periods'],
    queryFn: async () => {
      const res = await fetch('/api/reports/periods');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch fiscal periods');
      return json.data as string[];
    }
  });
}

export function useToggleFiscalPeriodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (month: string) => {
      const res = await fetch('/api/reports/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to toggle fiscal period');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.all, 'reports', 'periods'] });
    }
  });
}
