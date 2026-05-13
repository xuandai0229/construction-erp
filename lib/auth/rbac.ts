import { UserRole } from "@prisma/client";
import { Permission, Permissions } from "./permissions";

/**
 * Enterprise Role Definitions & Hierarchies
 */
export const RolePermissions: Record<string, Permission[]> = {
  ['SUPER_ADMIN']: Object.values(Permissions),
  
  ['DIRECTOR']: [
    Permissions.COST_VIEW,
    Permissions.PAYMENT_VIEW,
    Permissions.BUDGET_VIEW,
    Permissions.LEDGER_VIEW,
    Permissions.REPORTS_FINANCIAL,
  ],

  ['CHIEF_ACCOUNTANT']: [
    Permissions.COST_VIEW,
    Permissions.COST_APPROVE,
    Permissions.COST_REVERSE,
    Permissions.PAYMENT_VIEW,
    Permissions.PAYMENT_APPROVE,
    Permissions.LEDGER_VIEW,
    Permissions.LEDGER_REVERSE,
    Permissions.FISCAL_CLOSE,
    Permissions.REPORTS_FINANCIAL,
  ],

  ['ACCOUNTANT']: [
    Permissions.COST_VIEW,
    Permissions.COST_CREATE,
    Permissions.PAYMENT_VIEW,
    Permissions.PAYMENT_CREATE,
    Permissions.BUDGET_VIEW,
    Permissions.REPORTS_FINANCIAL,
  ],

  ['PROJECT_MANAGER']: [
    Permissions.COST_VIEW,
    Permissions.COST_CREATE,
    Permissions.BUDGET_VIEW,
    Permissions.BUDGET_CREATE,
  ],

  ['VIEWER']: [
    Permissions.COST_VIEW,
    Permissions.PAYMENT_VIEW,
    Permissions.BUDGET_VIEW,
    Permissions.LEDGER_VIEW,
  ],

  // Legacy mappings for safety during migration
  ['ADMIN']: Object.values(Permissions),
  ['MANAGER']: [
    Permissions.COST_VIEW,
    Permissions.COST_CREATE,
    Permissions.BUDGET_VIEW,
    Permissions.BUDGET_CREATE,
  ],
  ['GROUP_DIRECTOR']: [Permissions.REPORTS_FINANCIAL, Permissions.COST_VIEW],
  ['CFO']: [Permissions.REPORTS_FINANCIAL, Permissions.COST_APPROVE],
  ['BRANCH_DIRECTOR']: [Permissions.COST_VIEW],
  ['AUDITOR']: [Permissions.REPORTS_FINANCIAL, Permissions.COST_VIEW, Permissions.LEDGER_VIEW],
};

/**
 * Checks if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = RolePermissions[role] || [];
  return allowed.includes(permission);
}
