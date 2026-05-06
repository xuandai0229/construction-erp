import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "../audit.service";
import { InventoryTransactionType } from "@prisma/client";

export class InventoryService {
  /**
   * Records a Goods Receipt Note (GRN) from a PO.
   */
  static async recordReceipt(data: {
    projectId: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
    referenceId?: string; // PO Id
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          projectId: data.projectId,
          materialId: data.materialId,
          type: InventoryTransactionType.RECEIPT,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          referenceId: data.referenceId
        }
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "InventoryTransaction",
        entityId: transaction.id,
        newData: transaction,
        reason: "Nhập kho vật tư từ đơn mua hàng"
      });

      return transaction;
    });
  }

  /**
   * Records site consumption and checks for wastage/variance.
   */
  static async recordConsumption(data: {
    projectId: string;
    wbsId: string;
    materialId: string;
    quantity: number;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Record Consumption
      const consumption = await tx.siteConsumption.create({
        data: {
          projectId: data.projectId,
          wbsId: data.wbsId,
          materialId: data.materialId,
          quantity: data.quantity,
          date: new Date()
        }
      });

      // 2. Create an Inventory Issue transaction
      await tx.inventoryTransaction.create({
        data: {
          projectId: data.projectId,
          materialId: data.materialId,
          type: InventoryTransactionType.ISSUE,
          quantity: data.quantity
        }
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "SiteConsumption",
        entityId: consumption.id,
        newData: consumption,
        reason: "Xuất kho và ghi nhận tiêu hao vật tư tại công trường"
      });

      return consumption;
    });
  }

  /**
   * Material Reconciliation Analysis
   */
  static async getMaterialVariance(projectId: string, materialId: string) {
    const [receipts, consumptions] = await Promise.all([
      prisma.inventoryTransaction.aggregate({
        where: { projectId, materialId, type: InventoryTransactionType.RECEIPT },
        _sum: { quantity: true }
      }),
      prisma.siteConsumption.aggregate({
        where: { projectId, materialId },
        _sum: { quantity: true }
      })
    ]);

    const totalIn = Number(receipts._sum.quantity || 0);
    const totalOut = Number(consumptions._sum.quantity || 0);
    const stockAtSite = totalIn - totalOut;

    return {
      projectId,
      materialId,
      totalReceived: totalIn,
      totalConsumed: totalOut,
      currentStock: stockAtSite,
      status: stockAtSite < 0 ? "INCONSISTENT" : "OK"
    };
  }
}
