import { prisma } from "@/lib/prisma";

export class CommittedCostService {
  /**
   * Calculates the committed vs actual costs for a project/WBS.
   */
  static async getCommittedCostAnalysis(projectId: string, wbsId?: string) {
    // 1. Committed from Purchase Orders (Approved POs)
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        projectId,
        ...(wbsId && { items: { some: { wbsId } } }),
        status: { in: ["APPROVED", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED"] }
      },
      include: { items: true }
    });

    let poCommitted = 0;
    pos.forEach(po => {
      po.items.forEach(item => {
        if (!wbsId || item.wbsId === wbsId) {
          poCommitted += Number(item.amount);
        }
      });
    });

    // 2. Committed from Subcontracts (Active Subcontracts)
    const subcontracts = await prisma.subcontract.findMany({
      where: {
        projectId,
        ...(wbsId && { items: { some: { wbsId } } }),
        status: { in: ["ACTIVE", "COMPLETED"] }
      },
      include: { items: true }
    });

    let subconCommitted = 0;
    subcontracts.forEach(sc => {
      sc.items.forEach(item => {
        if (!wbsId || item.wbsId === wbsId) {
          subconCommitted += Number(item.totalAmount);
        }
      });
    });

    // 3. Actual Cost from Ledger (Already tracked in CostService/ProjectFinance)
    // We'll use the existing stats helper
    const actualCosts = await prisma.costRecord.aggregate({
        where: { projectId, ...(wbsId && { wbsId }) },
        _sum: { amount: true }
    });
    const actualValue = Number(actualCosts._sum.amount || 0);

    const totalCommitted = poCommitted + subconCommitted;

    return {
      projectId,
      wbsId,
      analysis: {
        poCommitted,
        subconCommitted,
        totalCommitted,
        actualCost: actualValue,
        // Exposure = Committed that hasn't become Actual yet
        remainingExposure: Math.max(0, totalCommitted - actualValue),
        utilizationRate: totalCommitted > 0 ? (actualValue / totalCommitted) * 100 : 0
      }
    };
  }
}
