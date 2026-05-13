import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export const CacheInvalidator = {
  invalidateCost: (queryClient: QueryClient, projectId: string) => {
    // A cost affects costs list and project dashboard stats
    queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
  },

  invalidatePayment: (queryClient: QueryClient, projectId: string) => {
    // Payment affects invoices, revenues, payments, and project stats
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.revenues.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
  },

  invalidateInvoice: (queryClient: QueryClient, projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(projectId), 'stats'] });
  },

  invalidateWBS: (queryClient: QueryClient, projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.wbs.byProject(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  },

  invalidateProject: (queryClient: QueryClient, projectId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
  }
};
