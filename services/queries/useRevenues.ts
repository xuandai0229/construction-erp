import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '@/services/api/revenue.api';
import { queryKeys } from '@/lib/query-keys';

export function useRevenuesQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.revenues.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getRevenuesByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch revenues');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateRevenueMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => revenueApi.createRevenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.revenues.byProject(projectId) });
    },
  });
}

export function useUpdateRevenueMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      revenueApi.updateRevenue(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.revenues.byProject(projectId) });
    },
  });
}

export function useInvoicesQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.invoices.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getInvoicesByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch invoices');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateInvoiceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => revenueApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
    },
  });
}

export function usePaymentsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.payments.byProject(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const res = await revenueApi.getPaymentsByProject(projectId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch payments');
      return res.data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreatePaymentMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => revenueApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
    },
  });
}

export function useDeletePaymentMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revenueApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
    },
  });
}
