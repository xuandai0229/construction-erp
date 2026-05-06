import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ProcurementStatus } from "@prisma/client";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";

export class ProcurementService {
  
  static async createPO(data: {
    projectId: string;
    vendor: string;
    description?: string;
    items: { wbsId?: string, description: string, quantity: number, unitPrice: number, costType: any }[];
    createdById?: string;
  }) {
    const totalAmount = round(data.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0));

    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          projectId: data.projectId,
          vendor: data.vendor,
          description: data.description,
          totalAmount,
          status: ProcurementStatus.ORDERED,
          createdById: data.createdById,
          items: {
            create: data.items.map(item => ({
              wbsId: item.wbsId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: round(item.quantity * item.unitPrice),
              costType: item.costType || 'material'
            }))
          }
        },
        include: { items: true }
      });

      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "PurchaseOrder",
        entityId: po.id,
        newData: po
      });

      return po;
    });
  }

  static async createGoodsReceipt(data: {
    purchaseOrderId: string;
    projectId: string;
    notes?: string;
    receivedById?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true }
      });

      if (!po) throw new ApiError(404, "Purchase Order not found");

      const gr = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: data.purchaseOrderId,
          projectId: data.projectId,
          notes: data.notes,
          receivedById: data.receivedById
        }
      });

      // When Goods are received, update PO status
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: ProcurementStatus.RECEIVED }
      });

      // Automatically create CostRecords for received goods
      for (const item of po.items) {
        if (item.wbsId) {
          await tx.costRecord.create({
            data: {
              projectId: po.projectId,
              wbsId: item.wbsId,
              costType: item.costType,
              amount: item.amount,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              supplier: po.vendor,
              note: `Nhận hàng từ PO ${po.poNumber || po.id}: ${item.description}`,
              date: new Date(),
              status: "unpaid",
              purchaseOrderId: po.id
            }
          });
          // Note: In a real ERP, the PostingEngine would post when the INVOICE arrives,
          // but for construction, we might post at Receipt (Accrued Liability).
          // We'll stick to user instructions: Generate journal entries for financial actions.
          // Receiving goods is a financial event.
        }
      }

      await AuditService.log({
        userId: data.receivedById,
        action: "CREATE",
        entity: "GoodsReceipt",
        entityId: gr.id,
        newData: gr
      });

      return gr;
    });
  }

  static async findPOsByProject(projectId: string) {
    return prisma.purchaseOrder.findMany({
      where: { projectId },
      include: { items: true, goodsReceipts: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
