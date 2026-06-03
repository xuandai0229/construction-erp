import { headers } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "../generated/prisma-client";
import { ApiError } from "./api-error";
import { SessionManager } from "./session";
import { AuditService } from "@/services/audit.service";

export const INTERNAL_ADMIN_ID = "system_internal_admin";

function isInternalAdminBypassEnabled() {
  return process.env.ALLOW_INTERNAL_ADMIN_BYPASS === "true" && process.env.NODE_ENV !== "production";
}

export async function getVerifiedSession() {
  let head;
  try {
    head = await headers();
  } catch (e) {
    // Gracefully handle calling outside of request scope (e.g. in test script or CLI runner)
    return null;
  }
  const authHeader = head?.get("authorization");
  const cookieHeader = head?.get("cookie");

  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieMatch = cookieHeader?.match(/erp-session=([^;]+)/);
    if (cookieMatch) {
      token = cookieMatch[1];
    }
  }

  if (!token) return null;
  return SessionManager.verifySession(token);
}

export async function getVerifiedSessionUserId() {
  const session = await getVerifiedSession();
  return session ? session.userId : null;
}

export async function assertAuthenticated() {
  const session = await getVerifiedSession();
  if (!session) {
    if (isInternalAdminBypassEnabled()) {
      return {
        id: INTERNAL_ADMIN_ID,
        role: UserRole.SUPER_ADMIN,
        name: "Quản trị viên hệ thống",
        companyId: null,
      };
    }
    await AuditService.log({
      action: "AUTH_FAILED",
      entity: "Security",
      entityId: "ANONYMOUS",
      reason: "Truy cập API khi không có phiên đăng nhập ERP hợp lệ.",
      severity: "CRITICAL",
    });
    throw new ApiError(401, "Bạn cần đăng nhập lại: phiên ERP không hợp lệ hoặc đã hết hạn.");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.deletedAt !== null) {
    throw new ApiError(401, "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
  }

  return user;
}

export async function assertHasRole(userId: string | undefined, allowedRoles: UserRole[]) {
  const verifiedUserId = await getVerifiedSessionUserId();
  const authoritativeUserId = verifiedUserId || userId;

  if (!verifiedUserId && !isInternalAdminBypassEnabled()) {
    await AuditService.log({
      action: "AUTH_FAILED",
      entity: "Security",
      entityId: userId || "ANONYMOUS",
      reason: "Truy cập API khi không có phiên đăng nhập ERP hợp lệ.",
      severity: "CRITICAL",
    });
    throw new ApiError(401, "Bạn cần đăng nhập lại: phiên ERP không hợp lệ hoặc đã hết hạn.");
  }

  if (!authoritativeUserId || authoritativeUserId === INTERNAL_ADMIN_ID) {
    if (!isInternalAdminBypassEnabled()) {
      throw new ApiError(401, "Cơ chế đăng nhập quản trị nội bộ đang bị tắt.");
    }
    return {
      id: INTERNAL_ADMIN_ID,
      role: UserRole.SUPER_ADMIN,
      name: "Quản trị viên hệ thống",
      companyId: null,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: authoritativeUserId } });
  if (!user || user.deletedAt !== null) {
    throw new ApiError(401, "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
  }

  if (!allowedRoles.includes(user.role)) {
    await AuditService.log({
      userId: user.id,
      action: "SECURITY_ALERT",
      entity: "RBAC",
      entityId: user.id,
      reason: `Phát hiện yêu cầu vượt quyền: vai trò ${user.role} gọi thao tác chỉ dành cho [${allowedRoles.join(", ")}].`,
      severity: "CRITICAL",
    });
    throw new ApiError(403, `Vai trò ${user.role} không được phép thực hiện thao tác này.`);
  }

  return user;
}

export async function assertIsAdmin(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
}

export async function assertIsManager(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BRANCH_DIRECTOR, UserRole.GROUP_DIRECTOR]);
}

export async function assertIsAccountant(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CFO]);
}

export async function assertIsDirector(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.SUPER_ADMIN, UserRole.GROUP_DIRECTOR, UserRole.ADMIN, UserRole.CFO]);
}

export async function assertIsBranchDirector(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.SUPER_ADMIN, UserRole.GROUP_DIRECTOR, UserRole.ADMIN, UserRole.BRANCH_DIRECTOR]);
}
