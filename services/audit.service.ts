import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export class AuditService {
  /**
   * Records an audit log entry.
   */
  static async log(params: {
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null,
          newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // We don't want to break the main flow if audit logging fails,
      // but we should log it to the console for debugging.
      console.error("[AuditService Error]:", error);
    }
  }
}
