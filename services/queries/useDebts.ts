import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '@/services/api/revenue.api';
import { queryKeys } from '@/lib/query-keys';

export function useInvoicesQuery(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.debts.receivables(), { projectId }],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getInvoicesByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Không thể tải công nợ phải thu.');
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
      if (!res.success) throw new Error(res.error || 'Không thể tải lịch sử thanh toán.');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useDeleteInvoiceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await revenueApi.deleteInvoice(id);
      if (!res.success) throw new Error(res.error || 'Không thể xóa hóa đơn.');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.receivables() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}
