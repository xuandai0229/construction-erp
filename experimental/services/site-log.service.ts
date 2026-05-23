import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";

export class SiteLogService {
  static async create(data: {
    projectId: string;
    date: string | Date;
    weather?: string;
    temperature?: number;
    manpower: number;
    equipment?: string;
    progress?: string;
    notes?: string;
    createdById?: string;
  }) {
    const log = await prisma.siteLog.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    });

    await AuditService.log({
      userId: data.createdById,
      action: "CREATE",
      entity: "SiteLog",
      entityId: log.id,
      newData: log
    });

    return log;
  }

  static async findByProject(projectId: string) {
    return prisma.siteLog.findMany({
      where: { projectId },
      orderBy: { date: "desc" }
    });
  }
}
