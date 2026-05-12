/**
 * ENTERPRISE RBAC PERMISSION DEFINITIONS
 * These are the granular actions that can be performed in the ERP system.
 */

export const Permissions = {
  // Cost Management
  COST_CREATE: 'cost.create',
  COST_APPROVE: 'cost.approve',
  COST_REVERSE: 'cost.reverse',
  COST_DELETE: 'cost.delete',
  COST_VIEW: 'cost.view',

  // Payment Management
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_APPROVE: 'payment.approve',
  PAYMENT_VIEW: 'payment.view',

  // Budget Management
  BUDGET_CREATE: 'budget.create',
  BUDGET_APPROVE: 'budget.approve',
  BUDGET_VIEW: 'budget.view',

  // Ledger & Accounting
  LEDGER_REVERSE: 'ledger.reverse',
  LEDGER_VIEW: 'ledger.view',
  FISCAL_CLOSE: 'fiscal.close',

  // User & System Management
  USERS_MANAGE: 'users.manage',
  SYSTEM_RESTORE: 'system.restore',
  REPORTS_FINANCIAL: 'reports.financial',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
