import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC, Module, Action } from "@/lib/rbac";
import { Prisma, UserRole } from "../generated/prisma-client";

export type AuthenticatedUser = Awaited<ReturnType<typeof assertAuthenticated>>;

const SYSTEM_INTERNAL_HEADER = "x-internal-system-token";

function isSuperAdmin(user: AuthenticatedUser) {
  return user.role === UserRole.SUPER_ADMIN;
}

export async function requireAuth() {
  return assertAuthenticated();
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, `Vai trò ${user.role} không được phép truy cập chức năng này.`);
  }
  return user;
}

export async function requirePermission(module: Module, action: Action) {
  const user = await requireAuth();
  RBAC.assertPermission(user.role, module, action);
  return user;
}

export async function requireAdmin() {
  return requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
}

export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN]);
}

export async function requireAccountingAccess(action: Action = "READ") {
  const user = await requireAuth();
  RBAC.assertPermission(user.role, "REPORT", action === "EXPORT" ? "EXPORT" : "READ");
  const readRoles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.AUDITOR,
    UserRole.MANAGER,
    UserRole.BRANCH_DIRECTOR,
    UserRole.GROUP_DIRECTOR,
  ];
  const exportRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CFO, UserRole.ACCOUNTANT, UserRole.AUDITOR, UserRole.GROUP_DIRECTOR];
  const allowedRoles = action === "EXPORT" ? exportRoles : readRoles;
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, `Vai trò ${user.role} không được phép truy cập dữ liệu kế toán.`);
  }
  return user;
}

export async function requireCompanyScope(user: AuthenticatedUser, companyId?: string | null) {
  if (isSuperAdmin(user) && !user.companyId) return true;
  if (!user.companyId) throw new ApiError(403, "Tài khoản chưa được gán công ty/pháp nhân.");
  if (companyId && companyId !== user.companyId) {
    throw new ApiError(403, "Không được truy cập dữ liệu của công ty/pháp nhân khác.");
  }
  return true;
}

export async function requireProjectAccess(user: AuthenticatedUser, projectId?: string | null) {
  if (!projectId) throw new ApiError(400, "Thiếu mã công trình để kiểm tra quyền truy cập.");

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, companyId: true, branchId: true },
  });

  if (!project) throw new ApiError(404, "Không tìm thấy công trình.");
  await requireCompanyScope(user, project.companyId);
  return project;
}

export async function requireProjectPermission(projectId: string | null | undefined, module: Module, action: Action) {
  const user = await requirePermission(module, action);
  await requireProjectAccess(user, projectId);
  return user;
}

export async function requireSystemInternalToken() {
  const token = process.env.INTERNAL_SYSTEM_TOKEN;
  if (!token) {
    throw new ApiError(503, "Chưa cấu hình khóa xác thực nội bộ của hệ thống.");
  }

  const head = await headers();
  const provided = head.get(SYSTEM_INTERNAL_HEADER);
  if (!provided || provided !== token) {
    throw new ApiError(401, "Yêu cầu xác thực nội bộ của hệ thống.");
  }
}

export async function auditSecurityAccess(params: {
  userId?: string;
  entity: string;
  entityId: string;
  reason: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  data?: unknown;
}) {
  const head = await headers();
  const audit = await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: "SECURITY_ALERT",
      entity: params.entity,
      entityId: params.entityId,
      reason: params.reason,
      severity: params.severity || "INFO",
      ipAddress: head.get("x-forwarded-for") || "unknown",
      userAgent: head.get("user-agent") || "unknown",
      newData: params.data as Prisma.InputJsonValue | undefined,
    },
  });
  return audit;
}

export async function auditExportOrThrow(params: {
  userId: string;
  companyId?: string | null;
  projectId?: string | null;
  reportType: string;
  format: string;
  reason?: string;
  filters?: Record<string, unknown>;
}) {
  const head = await headers();
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: "SECURITY_ALERT",
      entity: "FinancialExport",
      entityId: params.projectId || params.companyId || "GLOBAL",
      severity: "WARNING",
      reason: params.reason || `Financial export ${params.reportType} (${params.format})`,
      ipAddress: head.get("x-forwarded-for") || "unknown",
      userAgent: head.get("user-agent") || "unknown",
      newData: {
        companyId: params.companyId,
        projectId: params.projectId,
        reportType: params.reportType,
        filters: params.filters as Prisma.InputJsonValue | undefined,
        format: params.format,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function auditPrintOrThrow(params: {
  userId: string;
  companyId?: string | null;
  projectId?: string | null;
  printType: string;
  entityId: string;
  route: string;
  reason?: string;
  format?: string;
}) {
  const head = await headers();
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: "SECURITY_ALERT",
      entity: "FinancialPrint",
      entityId: params.entityId,
      severity: "WARNING",
      reason: params.reason || `In chứng từ tài chính ${params.printType}`,
      ipAddress: head.get("x-forwarded-for") || "unknown",
      userAgent: head.get("user-agent") || "unknown",
      newData: {
        companyId: params.companyId,
        projectId: params.projectId,
        printType: params.printType,
        entityId: params.entityId,
        route: params.route,
        format: params.format || "HTML",
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}
