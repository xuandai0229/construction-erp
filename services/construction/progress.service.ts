import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "../audit.service";

export interface MeasurementDTO {
  description?: string;
  length?: number;
  width?: number;
  height?: number;
  factor?: number;
}

export class ProgressService {
  static async recordProgress(data: {
    boqItemId: string;
    date: string;
    measurements: MeasurementDTO[];
    userId: string;
    note?: string;
  }) {
    // 1. Fetch BOQ Item to get unit rate
    const boqItem = await prisma.bOQItem.findUnique({
      where: { id: data.boqItemId }
    });
    if (!boqItem) throw new ApiError(404, "Không tìm thấy hạng mục BOQ");

    // 2. Calculate quantities from measurements
    let totalQty = 0;
    const measurementData = data.measurements.map(m => {
      const qty = (m.length || 1) * (m.width || 1) * (m.height || 1) * (m.factor || 1);
      totalQty += qty;
      return {
        description: m.description,
        length: m.length,
        width: m.width,
        height: m.height,
        factor: m.factor || 1,
        quantity: qty
      };
    });

    const totalAmount = totalQty * Number(boqItem.unitRate);

    return prisma.$transaction(async (tx) => {
      // 3. Create Progress Entry
      const entry = await tx.progressEntry.create({
        data: {
          boqItemId: data.boqItemId,
          date: new Date(data.date),
          quantity: totalQty,
          amount: totalAmount,
          createdById: data.userId,
          note: data.note,
          measurements: {
            create: measurementData
          }
        },
        include: { measurements: true }
      });

      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "ProgressEntry",
        entityId: entry.id,
        newData: entry,
      });

      return entry;
    });
  }

  /**
   * Verified progress becomes "Earned Value"
   */
  static async verifyProgress(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const entry = await tx.progressEntry.update({
        where: { id },
        data: { status: "VERIFIED" }
      });

      await AuditService.log({
        tx,
        userId,
        action: "UPDATE",
        entity: "ProgressEntry",
        entityId: id,
        newData: { status: "VERIFIED" },
        reason: "Xác nhận khối lượng thi công thực tế"
      });

      return entry;
    });
  }
}
