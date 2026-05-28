import { prisma } from "@/lib/prisma";
import { AuditLog } from "../generated/prisma-client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "APPROVE" | "REJECT" | "POST" | "LOCK" | "UNLOCK" | "HARD_DELETE" | "SECURITY_ALERT" | "AUTH_FAILED" | "REVERSE" | "ALLOCATE" | "CREATE_AP_PAYMENT_SIMULATION" | "SUBMIT" | "POST_PAYMENT";

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
    ipAddress,
    userAgent,
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
    ipAddress?: string;
    userAgent?: string;
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
          ipAddress,
          userAgent,
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

  /**
   * Enterprise Feature: Timeline Reconstruction
   * Replays the audit trail to reconstruct the exact state of an entity at a given historical timestamp.
   */
  static async reconstructTimeline(entity: string, entityId: string, upToTimestamp: Date) {
    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId, timestamp: { lte: upToTimestamp } },
      orderBy: { timestamp: "asc" } // Replay from oldest to newest
    });

    let state: any = {};
    for (const log of logs) {
      if (log.action === 'CREATE' || log.action === 'UPDATE') {
        state = { ...state, ...(log.newData as any || {}) };
      } else if (log.action === 'DELETE' || log.action === 'REVERSE') {
        state = { ...state, _isDeletedOrReversed: true };
      } else if (log.action === 'RESTORE') {
        state._isDeletedOrReversed = false;
      }
    }
    
    return {
      state,
      reconstructedAt: upToTimestamp,
      lastAction: logs.length > 0 ? logs[logs.length - 1] : null
    };
  }
}
