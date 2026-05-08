import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "REVERSE" | "REMINDER";
export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

export class AuditService {
  /**
   * Records an audit log entry within an optional transaction.
   */
  static async log(params: {
    tx?: any; // Prisma transaction client
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    reason?: string;
    severity?: AuditSeverity;
    requestId?: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const client = params.tx || prisma;
    try {
      await client.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null,
          newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : null,
          reason: params.reason,
          severity: params.severity || "INFO",
          requestId: params.requestId,
          correlationId: params.correlationId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // If we are inside a transaction, we MIGHT want to throw to rollback everything.
      // But usually audit log failures shouldn't break the business flow unless critical.
      // For this ERP, we'll log to console but NOT throw if no transaction was provided.
      // If a transaction WAS provided, we let it throw to ensure atomicity.
      console.error("[AuditService Error]:", error);
      if (params.tx) throw error; 
    }
  }
}
