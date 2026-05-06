import { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export enum AppAction {
  // Financial
  FINANCIAL_CREATE = "FINANCIAL_CREATE",
  FINANCIAL_UPDATE = "FINANCIAL_UPDATE",
  FINANCIAL_DELETE = "FINANCIAL_DELETE",
  FINANCIAL_REVERSE = "FINANCIAL_REVERSE",
  // Project
  PROJECT_CREATE = "PROJECT_CREATE",
  PROJECT_UPDATE = "PROJECT_UPDATE",
  PROJECT_DELETE = "PROJECT_DELETE",
  // Procurement
  PROCUREMENT_APPROVE = "PROCUREMENT_APPROVE",
}

const PERMISSIONS: Record<AppAction, UserRole[]> = {
  [AppAction.FINANCIAL_CREATE]: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER],
  [AppAction.FINANCIAL_UPDATE]: [UserRole.ADMIN, UserRole.ACCOUNTANT],
  [AppAction.FINANCIAL_DELETE]: [UserRole.ADMIN],
  [AppAction.FINANCIAL_REVERSE]: [UserRole.ADMIN, UserRole.ACCOUNTANT],
  [AppAction.PROJECT_CREATE]: [UserRole.ADMIN],
  [AppAction.PROJECT_UPDATE]: [UserRole.ADMIN, UserRole.MANAGER],
  [AppAction.PROJECT_DELETE]: [UserRole.ADMIN],
  [AppAction.PROCUREMENT_APPROVE]: [UserRole.ADMIN, UserRole.MANAGER],
};

export class RBAC {
  /**
   * Main authorization guard.
   * Checks both Role and Project Membership.
   */
  static async authorize(params: {
    userId: string;
    userRole: UserRole;
    action: AppAction;
    projectId?: string;
  }) {
    const { userId, userRole, action, projectId } = params;

    // 1. Check Role Permissions
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(403, `Role ${userRole} is not authorized to perform ${action}`);
    }

    // 2. Check Project Isolation (if project is specified and user is not Admin)
    if (projectId && userRole !== UserRole.ADMIN) {
      const isMember = await this.checkProjectAccess(userId, projectId);
      if (!isMember) {
        throw new ApiError(403, "Bạn không có quyền truy cập vào dự án này.");
      }
    }
  }

  /**
   * Verifies if a user is the owner or has access to a specific project.
   */
  static async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
        ],
        deletedAt: null
      }
    });
    return !!project;
  }

  static isAdmin(role: UserRole) { return role === UserRole.ADMIN; }
  static isAccountant(role: UserRole) { return role === UserRole.ACCOUNTANT || role === UserRole.ADMIN; }
  static isManager(role: UserRole) { return role === UserRole.MANAGER || role === UserRole.ADMIN; }
}
