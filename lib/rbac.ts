import { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

/**
 * Basic RBAC (Role Based Access Control) utilities.
 */
export class RBAC {
  /**
   * Ensures the user has the required role.
   * Currently uses a placeholder for user retrieval (e.g. from session).
   */
  static authorize(userRole: UserRole, requiredRoles: UserRole[]) {
    if (!requiredRoles.includes(userRole)) {
      throw new ApiError(403, "Bạn không có quyền thực hiện hành động này.");
    }
  }

  /**
   * Helper to check if user is Admin.
   */
  static isAdmin(role: UserRole) {
    return role === UserRole.ADMIN;
  }

  /**
   * Helper to check if user is Accountant.
   */
  static isAccountant(role: UserRole) {
    return role === UserRole.ACCOUNTANT || role === UserRole.ADMIN;
  }

  /**
   * Helper to check if user is Manager.
   */
  static isManager(role: UserRole) {
    return role === UserRole.MANAGER || role === UserRole.ADMIN;
  }
}
