import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ProcurementStatus } from "@prisma/client";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";

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

      if (!po) throw new ApiError(404, "Không tìm thấy Đơn mua hàng (PO)");

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

      // Automatically create Ledger Entries (GRN -> WIP/Inventory)
      for (const item of po.items) {
        if (item.wbsId) {
          await PostingEngine.postGoodsReceipt(tx, {
            receiptId: gr.id,
            projectId: po.projectId,
            amount: Number(item.amount),
            costType: item.costType as any,
            description: `Nhập kho từ PO ${po.poNumber || po.id}: ${item.description}`
          });
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
