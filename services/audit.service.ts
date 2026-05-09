import { prisma } from "@/lib/prisma";
import { AuditLog } from "../generated/prisma-client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "APPROVE" | "REJECT" | "LOCK" | "UNLOCK";

export class AuditService {
  static async log({
    userId,
    action,
    entity,
    entityId,
    oldData,
    newData,
    reason,
    severity = "INFO",
    requestId,
    correlationId,
  }: {
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    reason?: string;
    severity?: "INFO" | "WARNING" | "CRITICAL";
    requestId?: string;
    correlationId?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
          reason,
          severity,
          requestId,
          correlationId,
        },
      });
    } catch (error) {
      console.error("[AuditService Error]:", error);
      // We don't want to fail the main transaction if audit logging fails,
      // but in enterprise we should probably log it to a separate system.
    }
  }

  static async getHistory(entity: string, entityId: string) {
    return await prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
