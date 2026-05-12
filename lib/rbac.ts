import { RoleKey } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

/**
 * Basic RBAC (Role Based Access Control) utilities.
 */
export class RBAC {
  /**
   * Ensures the user has the required role.
   * Currently uses a placeholder for user retrieval (e.g. from session).
   */
  static authorize(userRole: RoleKey, requiredRoles: RoleKey[]) {
    if (!requiredRoles.includes(userRole)) {
      throw new ApiError(403, "Bạn không có quyền thực hiện hành động này.");
    }
  }

  /**
   * Helper to check if user is Admin.
   */
  static isAdmin(role: RoleKey) {
    return role === RoleKey.SUPER_ADMIN || role === RoleKey.ADMIN;
  }

  /**
   * Helper to check if user is Accountant.
   */
  static isAccountant(role: RoleKey) {
    return role === RoleKey.ACCOUNTANT;
  }

  /**
   * Helper to check if user is Manager.
   */
  static isManager(role: RoleKey) {
    return role === RoleKey.MANAGER;
  }
}
