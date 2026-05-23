import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { round } from "@/lib/math";
import crypto from "crypto";

export class ProgressService {
  static async createProgressEntry(data: {
    boqItemId: string;
    quantity: number;
    note?: string;
    createdById: string;
    measurements?: {
      length?: number;
      width?: number;
      height?: number;
      factor?: number;
      description?: string;
    }[];
  }) {
    const boqItem = await prisma.bOQItem.findUnique({
      where: { id: data.boqItemId }
    });

    if (!boqItem) throw new ApiError(404, "Không tìm thấy hạng mục BOQ");

    // 1. Verify: Completed quantity <= BOQ quantity (including pending/approved to prevent race conditions)
    const existingProgress = await prisma.progressEntry.aggregate({
      where: {
        boqItemId: data.boqItemId,
        status: { in: ["APPROVED", "PENDING"] }
      },
      _sum: { quantity: true }
    });

    const cumulativeQty = Number(existingProgress._sum?.quantity || 0);
    const newCumulative = round(cumulativeQty + data.quantity, 3);
    const boqQty = Number(boqItem.quantity);

    if (newCumulative > boqQty + 0.001) {
      throw new ApiError(400, `VƯỢT ĐỊNH MỨC BOQ: Khối lượng lũy kế nghiệm thu (${newCumulative}) vượt quá khối lượng BOQ đặt ra (${boqQty}).`);
    }

    const entryId = crypto.randomUUID();
    const amount = round(data.quantity * Number(boqItem.unitRate));

    return prisma.$transaction(async (tx) => {
      const entry = await tx.progressEntry.create({
        data: {
          id: entryId,
          boqItemId: data.boqItemId,
          quantity: data.quantity,
          amount: amount,
          createdById: data.createdById,
          note: data.note,
          status: "PENDING",
          updatedAt: new Date(),
          Measurement: data.measurements ? {
            create: data.measurements.map(m => ({
              id: crypto.randomUUID(),
              description: m.description,
              length: m.length,
              width: m.width,
              height: m.height,
              factor: m.factor ?? 1,
              quantity: round((m.length ?? 1) * (m.width ?? 1) * (m.height ?? 1) * (m.factor ?? 1), 3)
            }))
          } : undefined
        },
        include: { Measurement: true }
      });

      return entry;
    });
  }

  static async approveProgressEntry(id: string, userId: string) {
    const entry = await prisma.progressEntry.findUnique({
      where: { id }
    });

    if (!entry) throw new ApiError(404, "Không tìm thấy yêu cầu nghiệm thu");
    if (entry.status !== "PENDING") {
      throw new ApiError(400, `Yêu cầu nghiệm thu đang ở trạng thái ${entry.status}, không thể phê duyệt.`);
    }

    return prisma.progressEntry.update({
      where: { id },
      data: {
        status: "APPROVED",
        updatedAt: new Date()
      }
    });
  }

  static async rejectProgressEntry(id: string, userId: string) {
    const entry = await prisma.progressEntry.findUnique({
      where: { id }
    });

    if (!entry) throw new ApiError(404, "Không tìm thấy yêu cầu nghiệm thu");
    if (entry.status !== "PENDING") {
      throw new ApiError(400, `Yêu cầu nghiệm thu đang ở trạng thái ${entry.status}, không thể từ chối.`);
    }

    return prisma.progressEntry.update({
      where: { id },
      data: {
        status: "REJECTED",
        updatedAt: new Date()
      }
    });
  }
}
