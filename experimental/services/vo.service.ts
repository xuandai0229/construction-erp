import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";

export class VariationOrderService {
  static async create(data: {
    projectId: string;
    wbsId?: string;
    title: string;
    description?: string;
    amount: number;
    type: "ADDITION" | "OMISSION" | "SUBSTITUTION";
    createdById?: string;
  }) {
    const vo = await prisma.variationOrder.create({
      data: {
        ...data,
        status: "DRAFT"
      }
    });

    await AuditService.log({
      userId: data.createdById,
      action: "CREATE",
      entity: "VariationOrder",
      entityId: vo.id,
      newData: vo
    });

    return vo;
  }

  static async approve(id: string, userId?: string) {
    const vo = await prisma.variationOrder.update({
      where: { id },
      data: { status: "APPROVED" }
    });

    await AuditService.log({
      userId,
      action: "UPDATE",
      entity: "VariationOrder",
      entityId: vo.id,
      newData: vo
    });

    return vo;
  }

  static async findByProject(projectId: string) {
    return prisma.variationOrder.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });
  }
}
