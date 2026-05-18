import { prisma } from "./prisma";
import { UserRole } from "../generated/prisma-client";
import { ApiError } from "./api-error";
import { SessionManager } from "./session";
import { headers } from "next/headers";
import { AuditService } from "@/services/audit.service";

export const INTERNAL_ADMIN_ID = "system_internal_admin";

export async function assertHasRole(userId: string | undefined, allowedRoles: UserRole[]) {
  // Retrieve Next.js headers dynamically to perform authoritative token validation (Batch 7.1)
  const head = await headers();
  const authHeader = head.get("authorization");
  const cookieHeader = head.get("cookie");

  let verifiedSession: any = null;

  // 1. Check Authorization Bearer header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    verifiedSession = SessionManager.verifySession(token);
  }

  // 2. Check Cookie header (erp-session cookie)
  if (!verifiedSession && cookieHeader) {
    const match = cookieHeader.match(/erp-session=([^;]+)/);
    if (match) {
      verifiedSession = SessionManager.verifySession(match[1]);
    }
  }

  let authoritativeUserId = userId;

  if (verifiedSession) {
    authoritativeUserId = verifiedSession.userId;
  } else {
    // If no secure session token is found in production, reject mock header bypasses!
    if (process.env.NODE_ENV === "production") {
      const { MetricsCollector } = require("@/lib/metrics");
      MetricsCollector.recordFailedAuthAttempt();

      // Log suspicious login / unauthorized request alert (Batch 7.1 & 7.7)
      await AuditService.log({
        action: "AUTH_FAILED",
        entity: "Security",
        entityId: userId || "ANONYMOUS",
        reason: "Cảnh báo an ninh: Nỗ lực truy cập API không có Session Token hợp lệ trong môi trường Production.",
        severity: "CRITICAL"
      });
      throw new ApiError(401, "Yêu cầu bị từ chối: Phiên làm việc đã hết hạn hoặc không hợp lệ.");
    }
  }

  // Enforce system internal admin bypass when explicitly required or omitted
  if (!authoritativeUserId || authoritativeUserId === INTERNAL_ADMIN_ID) {
    return { 
      id: INTERNAL_ADMIN_ID, 
      role: UserRole.SUPER_ADMIN,
      name: "System Administrator" 
    };
  }

  // Fetch actual user from PostgreSQL to enforce genuine dynamic permission checking! (Batch 6.1)
  const user = await prisma.user.findUnique({
    where: { id: authoritativeUserId }
  });

  if (!user || user.deletedAt !== null) {
    throw new ApiError(401, "Người dùng không tồn tại hoặc tài khoản đã bị khóa.");
  }

  if (!allowedRoles.includes(user.role)) {
    // Audit unauthorized escalation attempts (Batch 7.2 & 7.7)
    await AuditService.log({
      userId: user.id,
      action: "SECURITY_ALERT",
      entity: "RBAC",
      entityId: user.id,
      reason: `Nỗ lực leo thang đặc quyền: Vai trò ${user.role} yêu cầu hành động chỉ dành cho [${allowedRoles.join(", ")}]`,
      severity: "CRITICAL"
    });

    throw new ApiError(
      403,
      `Yêu cầu bị từ chối. Vai trò ${user.role} không thuộc danh sách được phép thực hiện hành động này.`
    );
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
