import { headers } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "../generated/prisma-client";
import { ApiError } from "./api-error";
import { SessionManager } from "./session";
import { AuditService } from "@/services/audit.service";

export const INTERNAL_ADMIN_ID = "system_internal_admin";

async function getVerifiedSessionUserId() {
  const head = await headers();
  const authHeader = head.get("authorization");
  const cookieHeader = head.get("cookie");

  if (authHeader?.startsWith("Bearer ")) {
    const session = SessionManager.verifySession(authHeader.slice(7));
    if (session) return session.userId;
  }

  const cookieMatch = cookieHeader?.match(/erp-session=([^;]+)/);
  if (cookieMatch) {
    const session = SessionManager.verifySession(cookieMatch[1]);
    if (session) return session.userId;
  }

  return null;
}

export async function assertHasRole(userId: string | undefined, allowedRoles: UserRole[]) {
  const verifiedUserId = await getVerifiedSessionUserId();
  const authoritativeUserId = verifiedUserId || userId;

  if (!verifiedUserId && process.env.ALLOW_INTERNAL_ADMIN_BYPASS !== "true") {
    await AuditService.log({
      action: "AUTH_FAILED",
      entity: "Security",
      entityId: userId || "ANONYMOUS",
      reason: "API access without a valid signed ERP session token.",
      severity: "CRITICAL",
    });
    throw new ApiError(401, "Authentication required: invalid or expired ERP session.");
  }

  if (!authoritativeUserId || authoritativeUserId === INTERNAL_ADMIN_ID) {
    if (process.env.ALLOW_INTERNAL_ADMIN_BYPASS !== "true") {
      throw new ApiError(401, "Internal administrator bypass is disabled.");
    }
    return {
      id: INTERNAL_ADMIN_ID,
      role: UserRole.SUPER_ADMIN,
      name: "System Administrator",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: authoritativeUserId } });
  if (!user || user.deletedAt !== null) {
    throw new ApiError(401, "User does not exist or has been disabled.");
  }

  if (!allowedRoles.includes(user.role)) {
    await AuditService.log({
      userId: user.id,
      action: "SECURITY_ALERT",
      entity: "RBAC",
      entityId: user.id,
      reason: `Privilege escalation attempt: role ${user.role} requested action limited to [${allowedRoles.join(", ")}].`,
      severity: "CRITICAL",
    });
    throw new ApiError(403, `Role ${user.role} is not allowed to perform this action.`);
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
