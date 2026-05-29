import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { Decimal } from "decimal.js";
import { Prisma } from "../generated/prisma-client";

export class InventoryReportService {
  /**
   * 1. THẺ KHO (STOCK CARD)
   * Theo dõi chi tiết 1 vật tư trong 1 kho cụ thể
   */
  static async getStockCard(params: {
    companyId: string;
    warehouseId: string;
    materialItemId: string;
    projectId?: string;
    wbsId?: string;
    fromDate: Date | string;
    toDate: Date | string;
  }) {
    const from = new Date(params.fromDate);
    const to = new Date(params.toDate);

    // a. Tính tồn đầu kỳ (tích lũy tất cả movement trước fromDate)
    const openingMovements = await prisma.inventoryMovement.findMany({
      where: {
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        materialItemId: params.materialItemId,
        projectId: params.projectId || undefined,
        wbsId: params.wbsId || undefined,
        movementDate: { lt: from },
      },
    });

    let openingQty = new Decimal(0);
    let openingCost = new Decimal(0);

    for (const mov of openingMovements) {
      const q = new Decimal(mov.quantity.toString());
      const amt = new Decimal(mov.amount.toString());

      if (q.greaterThan(0)) {
        openingQty = openingQty.plus(q);
        openingCost = openingCost.plus(amt);
      } else {
        // Issuing reduces quantity and cost proportionally
        openingQty = openingQty.plus(q); // q is negative
        openingCost = openingCost.minus(amt);
      }
    }

    let openingAvgCost = new Decimal(0);
    if (openingQty.greaterThan(0)) {
      openingAvgCost = openingCost.dividedBy(openingQty).toDecimalPlaces(2);
    }

    // b. Lấy danh sách movement trong kỳ
    const periodMovements = await prisma.inventoryMovement.findMany({
      where: {
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        materialItemId: params.materialItemId,
        projectId: params.projectId || undefined,
        wbsId: params.wbsId || undefined,
        movementDate: { gte: from, lte: to },
      },
      orderBy: {
        movementDate: "asc",
      },
      include: {
        document: true,
      },
    });

    // c. Điền thẻ kho chi tiết
    const lines = [];
    let runningQty = openingQty;
    let runningCost = openingCost;

    for (const mov of periodMovements) {
      const q = new Decimal(mov.quantity.toString());
      const amt = new Decimal(mov.amount.toString());

      const isInput = q.greaterThan(0);
      const inputQty = isInput ? q : new Decimal(0);
      const inputAmt = isInput ? amt : new Decimal(0);
      const outputQty = isInput ? new Decimal(0) : q.negated();
      const outputAmt = isInput ? new Decimal(0) : amt;

      runningQty = runningQty.plus(q);
      if (isInput) {
        runningCost = runningCost.plus(amt);
      } else {
        runningCost = runningCost.minus(amt);
      }

      let runningAvg = new Decimal(0);
      if (runningQty.greaterThan(0)) {
        runningAvg = runningCost.dividedBy(runningQty).toDecimalPlaces(2);
      }

      lines.push({
        id: mov.id,
        movementDate: mov.movementDate,
        documentType: mov.documentType,
        documentNo: mov.documentNo,
        description: mov.document.description || "Giao dịch kho",
        inputQuantity: Number(inputQty),
        inputAmount: Number(inputAmt),
        outputQuantity: Number(outputQty),
        outputAmount: Number(outputAmt),
        runningQuantity: Number(runningQty),
        runningAmount: Number(runningCost),
        runningAvgCost: Number(runningAvg),
      });
    }

    return {
      openingQuantity: Number(openingQty),
      openingAmount: Number(openingCost),
      openingAvgCost: Number(openingAvgCost),
      lines,
      closingQuantity: Number(runningQty),
      closingAmount: Number(runningCost),
      closingAvgCost: runningQty.greaterThan(0) ? Number(runningCost.dividedBy(runningQty).toDecimalPlaces(2)) : 0,
    };
  }

  /**
   * 2. BÁO CÁO NHẬP XUẤT TỒN (STOCK REGISTER)
   * Tổng hợp xuất nhập tồn của toàn bộ vật tư trong một kho
   */
  static async getStockRegister(params: {
    companyId: string;
    warehouseId?: string;
    projectId?: string;
    fromDate: Date | string;
    toDate: Date | string;
  }) {
    const from = new Date(params.fromDate);
    const to = new Date(params.toDate);

    // Lấy toàn bộ vật tư có phát sinh tồn kho hoặc movement trong kỳ
    const materials = await prisma.materialItem.findMany({
      where: {
        companyId: params.companyId,
        deletedAt: null,
      },
    });

    const result = [];

    for (const mat of materials) {
      // Tồn đầu kỳ: tất cả movement trước fromDate
      const preMovements = await prisma.inventoryMovement.findMany({
        where: {
          companyId: params.companyId,
          warehouseId: params.warehouseId || undefined,
          projectId: params.projectId || undefined,
          materialItemId: mat.id,
          movementDate: { lt: from },
        },
      });

      let openingQty = new Decimal(0);
      let openingCost = new Decimal(0);
      for (const mov of preMovements) {
        const q = new Decimal(mov.quantity.toString());
        const amt = new Decimal(mov.amount.toString());

        openingQty = openingQty.plus(q);
        if (q.greaterThan(0)) {
          openingCost = openingCost.plus(amt);
        } else {
          openingCost = openingCost.minus(amt);
        }
      }

      // Movements trong kỳ
      const periodMovements = await prisma.inventoryMovement.findMany({
        where: {
          companyId: params.companyId,
          warehouseId: params.warehouseId || undefined,
          projectId: params.projectId || undefined,
          materialItemId: mat.id,
          movementDate: { gte: from, lte: to },
        },
      });

      let inQty = new Decimal(0);
      let inCost = new Decimal(0);
      let outQty = new Decimal(0);
      let outCost = new Decimal(0);

      for (const mov of periodMovements) {
        const q = new Decimal(mov.quantity.toString());
        const amt = new Decimal(mov.amount.toString());

        if (q.greaterThan(0)) {
          inQty = inQty.plus(q);
          inCost = inCost.plus(amt);
        } else {
          outQty = outQty.plus(q.negated());
          outCost = outCost.plus(amt);
        }
      }

      const closingQty = openingQty.plus(inQty).minus(outQty);
      const closingCost = openingCost.plus(inCost).minus(outCost);

      if (
        openingQty.abs().greaterThan(0) ||
        inQty.greaterThan(0) ||
        outQty.greaterThan(0) ||
        closingQty.abs().greaterThan(0)
      ) {
        result.push({
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          unit: mat.unit,
          openingQuantity: Number(openingQty),
          openingAmount: Number(openingCost),
          inputQuantity: Number(inQty),
          inputAmount: Number(inCost),
          outputQuantity: Number(outQty),
          outputAmount: Number(outCost),
          closingQuantity: Number(closingQty),
          closingAmount: Number(closingCost),
        });
      }
    }

    return result;
  }

  /**
   * 3. BÁO CÁO TỒN THEO CÔNG TRÌNH / DỰ ÁN (PROJECT INVENTORY BALANCE)
   * Kiểm soát chi tiết tồn bãi tại công trình để tránh rò rỉ nguyên vật liệu
   */
  static async getProjectInventoryBalance(companyId: string, projectId: string) {
    const balances = await prisma.inventoryBalance.findMany({
      where: {
        companyId,
        projectId,
      },
      include: {
        material: true,
        warehouse: true,
      },
    });

    return balances.map((b) => ({
      id: b.id,
      warehouseCode: b.warehouse.code,
      warehouseName: b.warehouse.name,
      materialCode: b.material.code,
      materialName: b.material.name,
      unit: b.material.unit,
      quantity: Number(b.quantity),
      totalCost: Number(b.totalCost),
      avgCost: Number(b.avgCost),
    }));
  }
}
