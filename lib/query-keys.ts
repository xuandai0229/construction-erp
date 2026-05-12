export const queryKeys = {
  // Global
  all: ['erp-system'] as const,
  
  // Projects
  projects: {
    all: () => [...queryKeys.all, 'projects'] as const,
    lists: () => [...queryKeys.projects.all(), 'list'] as const,
    list: (filters: string) => [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },

  // Costs
  costs: {
    all: () => [...queryKeys.all, 'costs'] as const,
    lists: () => [...queryKeys.costs.all(), 'list'] as const,
    byProject: (projectId: string) => [...queryKeys.costs.lists(), { projectId }] as const,
    allCosts: () => [...queryKeys.costs.lists(), 'all'] as const,
  },

  // WBS
  wbs: {
    all: () => [...queryKeys.all, 'wbs'] as const,
    byProject: (projectId: string) => [...queryKeys.wbs.all(), { projectId }] as const,
  },

  // Budgets
  budgets: {
    all: () => [...queryKeys.all, 'budgets'] as const,
    byProject: (projectId: string) => [...queryKeys.budgets.all(), { projectId }] as const,
  },

  // Revenues
  revenues: {
    all: () => [...queryKeys.all, 'revenues'] as const,
    lists: () => [...queryKeys.revenues.all(), 'list'] as const,
    byProject: (projectId: string) => [...queryKeys.revenues.lists(), { projectId }] as const,
  },

  // Debts (Invoices)
  debts: {
    all: () => [...queryKeys.all, 'debts'] as const,
    receivables: () => [...queryKeys.debts.all(), 'receivables'] as const,
  },

  // Invoices
  invoices: {
    all: () => [...queryKeys.all, 'invoices'] as const,
    byProject: (projectId: string) => [...queryKeys.invoices.all(), { projectId }] as const,
  },

  // Payments
  payments: {
    all: () => [...queryKeys.all, 'payments'] as const,
    byProject: (projectId: string) => [...queryKeys.payments.all(), { projectId }] as const,
  }
};
