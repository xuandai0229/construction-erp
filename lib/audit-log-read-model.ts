import { Prisma } from "../generated/prisma-client";

const SENSITIVE_KEY_PATTERN = /(password|token|secret|apiKey|accessKey|refreshToken|privateKey|authorization)/i;

export function sanitizeAuditPayload(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditPayload(item));
  if (typeof value !== "object") return value;

  const entries = Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) return [key, "[Đã ẩn]"];
    return [key, sanitizeAuditPayload(entryValue)];
  });

  return Object.fromEntries(entries);
}

export function normalizeAuditLimit(rawLimit: string | null, defaultLimit = 20) {
  const parsed = Number(rawLimit || defaultLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultLimit;
  return Math.min(Math.floor(parsed), 50);
}

export function buildRecentAuditWhere(scope: string | null, entity: string | null, action: string | null): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (scope === "financial-reports") {
    where.OR = [{ entity: "FinancialExport" }, { entity: "FinancialPrint" }];
  } else if (entity) {
    where.entity = entity;
  }

  if (action) where.action = action;
  return where;
}

export function toAuditReadItem(log: {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData: unknown;
  newData: unknown;
  reason: string | null;
  severity: string;
  correlationId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  user?: { id: string; name: string | null; email: string; role: string } | null;
}) {
  return {
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    oldData: sanitizeAuditPayload(log.oldData),
    newData: sanitizeAuditPayload(log.newData),
    reason: log.reason,
    severity: log.severity,
    correlationId: log.correlationId,
    requestId: log.requestId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.timestamp.toISOString(),
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
          role: log.user.role,
        }
      : null,
  };
}
