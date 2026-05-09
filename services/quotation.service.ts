import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";

export class QuotationService {
  static async addQuotation(data: {
    purchaseRequestId: string;
    vendor: string;
    totalAmount: number;
    leadTimeDays?: number;
    validUntil?: Date;
    notes?: string;
  }) {
    const quote = await prisma.quotation.create({
      data: {
        ...data,
        status: "PENDING"
      }
    });

    return quote;
  }

  static async compareQuotations(purchaseRequestId: string) {
    const quotes = await prisma.quotation.findMany({
      where: { purchaseRequestId },
      orderBy: { totalAmount: "asc" }
    });

    if (quotes.length === 0) return null;

    const minAmount = Number(quotes[0].totalAmount);
    const minLeadTime = Math.min(...quotes.filter(q => q.leadTimeDays).map(q => q.leadTimeDays!));

    return quotes.map(q => ({
      ...q,
      isBestPrice: Number(q.totalAmount) === minAmount,
      isFastest: q.leadTimeDays === minLeadTime,
      priceVariance: minAmount > 0 ? (Number(q.totalAmount) - minAmount) / minAmount : 0
    }));
  }

  static async selectQuotation(id: string, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const selected = await tx.quotation.findUnique({ where: { id } });
      if (!selected) throw new Error("Quotation not found");

      // Reject others for same PR
      await tx.quotation.updateMany({
        where: { purchaseRequestId: selected.purchaseRequestId, id: { not: id } },
        data: { status: "REJECTED" }
      });

      const updated = await tx.quotation.update({
        where: { id },
        data: { status: "SELECTED" }
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "Quotation",
        entityId: id,
        newData: updated
      });

      return updated;
    });
  }
}
