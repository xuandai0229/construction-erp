import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";

export class BOQService {
  static async findByProject(projectId: string) {
    return await prisma.bOQItem.findMany({
      where: { projectId, deletedAt: null },
      include: {
        WBSItem: { select: { name: true, code: true } }
      }
    });
  }

  static async create(data: {
    projectId: string;
    wbsId: string;
    description: string;
    unit: string;
    quantity: number;
    unitRate: number;
  }, userId?: string) {
    const totalAmount = round(data.quantity * data.unitRate);
    
    const item = await prisma.bOQItem.create({
      data: {
        ...data,
        totalAmount,
      }
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "BOQItem",
      entityId: item.id,
      newData: item
    });

    return item;
  }

  static async createVersion(projectId: string, description: string, userId?: string) {
    const items = await this.findByProject(projectId);
    const lastVersion = await prisma.budgetVersion.findFirst({
      where: { projectId },
      orderBy: { version: "desc" }
    });

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const budgetVersion = await prisma.budgetVersion.create({
      data: {
        projectId,
        version: nextVersion,
        description,
        status: "APPROVED",
        snapshot: items as any,
        createdById: userId
      }
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "BudgetVersion",
      entityId: budgetVersion.id,
      newData: budgetVersion
    });

    return budgetVersion;
  }
}
