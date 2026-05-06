import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "../audit.service";

export class BOQService {
  static async create(data: {
    projectId: string;
    wbsId: string;
    description: string;
    unit: string;
    quantity: number;
    unitRate: number;
    userId: string;
  }) {
    const totalAmount = data.quantity * data.unitRate;

    return prisma.$transaction(async (tx) => {
      const item = await tx.bOQItem.create({
        data: {
          projectId: data.projectId,
          wbsId: data.wbsId,
          description: data.description,
          unit: data.unit,
          quantity: data.quantity,
          unitRate: data.unitRate,
          totalAmount: totalAmount,
        },
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "BOQItem",
        entityId: item.id,
        newData: item,
      });

      return item;
    });
  }

  static async getProjectBOQ(projectId: string) {
    return prisma.bOQItem.findMany({
      where: { projectId, deletedAt: null },
      include: {
        wbs: { select: { name: true, code: true } },
        progressEntries: {
          where: { status: "VERIFIED" },
          select: { quantity: true, amount: true }
        }
      },
      orderBy: { wbs: { code: "asc" } }
    });
  }
}
