import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "../audit.service";
import { SubcontractStatus } from "@prisma/client";

export class SubcontractService {
  /**
   * Creates a new subcontract with BOQ items.
   */
  static async create(data: {
    projectId: string;
    contractorName: string;
    title: string;
    contractNumber?: string;
    retentionRate?: number;
    items: {
      wbsId: string;
      description: string;
      unit: string;
      quantity: number;
      unitRate: number;
    }[];
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Calculate total value
      const totalValue = data.items.reduce((sum, item) => sum + (item.quantity * item.unitRate), 0);

      // 2. Create Subcontract
      const subcontract = await tx.subcontract.create({
        data: {
          projectId: data.projectId,
          contractorName: data.contractorName,
          contractNumber: data.contractNumber,
          title: data.title,
          totalValue: totalValue,
          retentionRate: data.retentionRate || 5,
          status: SubcontractStatus.ACTIVE,
          items: {
            create: data.items.map(item => ({
              wbsId: item.wbsId,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitRate: item.unitRate,
              totalAmount: item.quantity * item.unitRate
            }))
          }
        },
        include: { items: true }
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "Subcontract",
        entityId: subcontract.id,
        newData: subcontract
      });

      return subcontract;
    });
  }

  /**
   * Records work progress for a subcontractor item.
   */
  static async recordProgress(data: {
    subcontractItemId: string;
    quantity: number;
    date?: string;
    userId: string;
  }) {
    const item = await prisma.subcontractItem.findUnique({
      where: { id: data.subcontractItemId }
    });
    if (!item) throw new ApiError(404, "Không tìm thấy hạng mục thầu phụ");

    const amount = data.quantity * Number(item.unitRate);

    return prisma.$transaction(async (tx) => {
      const progress = await tx.subcontractProgress.create({
        data: {
          subcontractItemId: data.subcontractItemId,
          quantity: data.quantity,
          amount: amount,
          date: data.date ? new Date(data.date) : new Date(),
          status: "PENDING"
        }
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "SubcontractProgress",
        entityId: progress.id,
        newData: progress
      });

      return progress;
    });
  }
}
