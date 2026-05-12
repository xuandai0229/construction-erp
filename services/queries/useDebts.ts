import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '@/services/api/revenue.api';
import { queryKeys } from '@/lib/query-keys';

export function useInvoicesQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.debts.receivables(), { projectId }],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getInvoicesByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch invoices');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function usePaymentsQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.debts.all(), 'payments', { projectId }],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getPaymentsByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch payments');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useDeleteInvoiceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revenueApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.receivables() });
    },
  });
}
