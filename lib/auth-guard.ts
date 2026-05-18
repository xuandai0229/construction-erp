import { headers } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "../generated/prisma-client";
import { ApiError } from "./api-error";
import { SessionManager } from "./session";
import { AuditService } from "@/services/audit.service";

export const INTERNAL_ADMIN_ID = "system_internal_admin";

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
    if (process.env.ALLOW_INTERNAL_ADMIN_BYPASS === "true") {
      const head = await headers();
      const internalAdminId = head.get("x-user-id");
      if (internalAdminId === INTERNAL_ADMIN_ID) {
        return {
          id: INTERNAL_ADMIN_ID,
          role: UserRole.SUPER_ADMIN,
          name: "System Administrator",
          companyId: null,
        };
      }
    }
    await AuditService.log({
      action: "AUTH_FAILED",
      entity: "Security",
      entityId: "ANONYMOUS",
      reason: "API access without a valid signed ERP session token.",
      severity: "CRITICAL",
    });
    throw new ApiError(401, "Authentication required: invalid or expired ERP session.");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.deletedAt !== null) {
    throw new ApiError(401, "User does not exist or has been disabled.");
  }

  return user;
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
