import { prisma } from "@/lib/prisma";

export class OrganizationalMemoryService {
  /**
   * Stores a "Learning" from an operational event.
   */
  static async recordLearning(projectId: string, eventType: string, lesson: string) {
    // For now, we use AuditLog to store organizational memory
    // In a future phase, this would be a separate model
    return prisma.auditLog.create({
      data: {
        userId: "SYSTEM",
        action: "UPDATE",
        entity: "OrgMemory",
        entityId: projectId,
        newData: { eventType, lesson, category: "LEARNING" }
      }
    });
  }

  /**
   * Retrieves past learnings for a specific category.
   */
  static async getPastLearnings(category: string) {
    return prisma.auditLog.findMany({
      where: {
        entity: "OrgMemory",
        newData: { path: ["category"], equals: category }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
  }
}
