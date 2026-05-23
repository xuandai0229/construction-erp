import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class RetentionService {
  static async getRetentionSummary(projectId: string) {
    const [invoices, costs] = await Promise.all([
      prisma.invoice.findMany({
        where: { projectId, retentionAmount: { gt: 0 }, deletedAt: null },
      }),
      prisma.costRecord.findMany({
        where: { projectId, retentionAmount: { gt: 0 }, deletedAt: null },
      })
    ]);

    const totalReceivableRetention = invoices.reduce((s, i) => s + Number(i.retentionAmount), 0);
    const totalPayableRetention = costs.reduce((s, c) => s + Number(c.retentionAmount), 0);

    return {
      totalReceivableRetention: round(totalReceivableRetention),
      totalPayableRetention: round(totalPayableRetention),
      receivableCount: invoices.length,
      payableCount: costs.length
    };
  }

  static calculateRetention(amount: number, rate: number) {
    const retentionAmount = round(amount * (rate / 100));
    const netAmount = round(amount - retentionAmount);
    
    return {
      retentionAmount,
      netAmount,
      retentionRate: rate
    };
  }
}
