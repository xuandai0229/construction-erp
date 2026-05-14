
import { prisma } from "../lib/prisma";
import { LoggerService } from "./logger.service";

export class NotificationService {
  /**
   * Creates a notification for a user (Raw SQL to bypass Prisma Client lock)
   */
  static async notify(userId: string, data: {
    title: string,
    message: string,
    type: "OVERDUE" | "APPROVAL" | "RISK" | "GOVERNANCE",
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL",
    priority?: number,
    entityType?: string,
    entityId?: string
  }) {
    try {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "Notification" (id, "userId", title, message, type, severity, priority, "entityType", "entityId", "isRead", "createdAt")
        VALUES (${id}, ${userId}, ${data.title}, ${data.message}, ${data.type}, ${data.severity}, ${data.priority || 0}, ${data.entityType || null}, ${data.entityId || null}, false, NOW())
      `;
      await LoggerService.info(`NotificationSent: ${id} to User ${userId}`);
      return { id };
    } catch (e) {
      await LoggerService.error(`Failed to send notification to User ${userId}`, e as any);
    }
  }

  /**
   * Gets unread notifications for a user
   */
  static async getUnread(userId: string) {
    return prisma.$queryRaw`
      SELECT * FROM "Notification" 
      WHERE "userId" = ${userId} AND "isRead" = false 
      ORDER BY "createdAt" DESC 
      LIMIT 50
    ` as any;
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(id: string) {
    return prisma.$executeRaw`
      UPDATE "Notification" SET "isRead" = true WHERE id = ${id}
    `;
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.$executeRaw`
      UPDATE "Notification" SET "isRead" = true WHERE "userId" = ${userId} AND "isRead" = false
    `;
  }

  /**
   * Suppression logic
   */
  static async isDuplicate(userId: string, title: string, minutes: number = 60) {
    const threshold = new Date(Date.now() - minutes * 60000);
    const recent: any[] = await prisma.$queryRaw`
      SELECT id FROM "Notification" 
      WHERE "userId" = ${userId} AND title = ${title} AND "createdAt" >= ${threshold}
      LIMIT 1
    `;
    return recent.length > 0;
  }
}
