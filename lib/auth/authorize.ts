import { RoleKey } from "@prisma/client";
import { Permission } from "./permissions";
import { hasPermission as checkPermission } from "./rbac";
import { ApiError } from "@/lib/api-error";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

/**
 * Enterprise Authorization Engine
 * Source of Truth: ERP Database (User Table)
 */
export class Authorizer {
  /**
   * Required for server-side actions.
   * Verifies permission against the Role stored in our Local Database.
   */
  static async requirePermission(userId: string, permission: Permission) {
    // 1. Fetch from Local DB (Primary Source of Truth)
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userId }
        ]
      }
    });

    let role: RoleKey | undefined = dbUser?.role as RoleKey;

    // 2. Fallback to Supabase Metadata (For new/un-synced users)
    if (!role) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user) {
        role = user.user_metadata?.role as RoleKey;
      }
    }
    
    if (!role) {
      throw new ApiError(401, "Tài khoản chưa được phân quyền. Vui lòng liên hệ Admin.");
    }

    if (!checkPermission(role, permission)) {
      throw new ApiError(403, `Bạn không có quyền: ${permission}`);
    }

    return dbUser || { id: userId };
  }

  /**
   * Helper for role-based checks
   */
  static async requireRole(userId: string, allowedRoles: RoleKey[]) {
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userId }
        ]
      }
    });

    let role: RoleKey | undefined = dbUser?.role as RoleKey;

    if (!role) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      role = user?.user_metadata?.role as RoleKey;
    }
    
    if (!role || !allowedRoles.includes(role)) {
      throw new ApiError(403, "Bạn không có quyền thực hiện hành động này.");
    }

    return dbUser || { id: userId };
  }

  /**
   * Scoped access check
   */
  static async validateScope(userId: string, projectId: string) {
    return true;
  }
}
