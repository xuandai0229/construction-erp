import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";

export class EventStreamService {
  /**
   * Persists an event into the stream database
   */
  static async appendToStream(type: string, payload: any, companyId: string, projectId?: string, userId?: string) {
    LoggerService.info(`[Event Stream] Appending event ${type} under tenant ${companyId}`);

    return await prisma.domainEvent.create({
      data: {
        type,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : {},
        metadata: { userId, companyId, projectId },
        projectId: projectId || null,
        status: "PROCESSED",
        processedAt: new Date()
      }
    });
  }

  /**
   * Replays historical events in chronological order from a given timestamp
   */
  static async replayStream(companyId: string, options: { projectId?: string; since?: Date } = {}) {
    LoggerService.warn(`[Event Stream] Replaying event streams for tenant ${companyId} starting from: ${options.since || 'BEGINNING OF TIME'}`);

    const whereClause: any = {
      metadata: {
        path: ["companyId"],
        equals: companyId
      }
    };

    if (options.projectId) {
      whereClause.projectId = options.projectId;
    }

    if (options.since) {
      whereClause.timestamp = { gte: options.since };
    }

    return await prisma.domainEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: "asc" }
    });
  }

  /**
   * Captures a state snapshot to prevent playing full historical stream from zero
   */
  static async captureSnapshot(companyId: string, projectId: string, snapshotType: string, data: any, version: string) {
    LoggerService.info(`[Event Stream] Capturing state snapshot for project ${projectId} (Type: ${snapshotType}, Version: ${version})`);

    return await prisma.financialSnapshot.create({
      data: {
        projectId,
        companyId,
        snapshotType,
        version,
        data,
        isLocked: true
      }
    });
  }

  /**
   * Retrieves the latest snapshotted state
   */
  static async getLatestSnapshot(companyId: string, projectId: string, snapshotType: string) {
    return await prisma.financialSnapshot.findFirst({
      where: { companyId, projectId, snapshotType },
      orderBy: { createdAt: "desc" }
    });
  }
}
