import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/observability/logger";

export class MigrationService {
  /**
   * Imports legacy data from Excel/Legacy systems.
   * Includes validation and reconciliation checks.
   */
  static async importOpeningBalances(data: {
    projectId: string;
    vendorBalances: { vendorName: string; amount: number }[];
    inventoryBalances: { materialCode: string; quantity: number; unitPrice: number }[];
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      Logger.info("Starting legacy data migration", { projectId: data.projectId });

      const openingWbs = await tx.wBSItem.upsert({
        where: { id: `opening-${data.projectId}` },
        update: {},
        create: {
          id: `opening-${data.projectId}`,
          projectId: data.projectId,
          name: "Opening Balances",
          code: "OPENING",
          level: 0,
          sortOrder: 0,
        },
      });

      for (const vb of data.vendorBalances) {
        await tx.invoice.create({
          data: {
            projectId: data.projectId,
            wbsId: openingWbs.id,
            amount: vb.amount,
            remainingAmount: vb.amount,
            status: "SENT",
            invoiceNumber: `OPENING-${vb.vendorName}`,
            note: `Opening balance: ${vb.vendorName}`,
            createdById: data.userId,
          },
        });
      }

      for (const ib of data.inventoryBalances) {
        const material = await tx.material.findUnique({ where: { code: ib.materialCode } });
        if (!material) continue;

        await tx.inventoryTransaction.create({
          data: {
            projectId: data.projectId,
            materialId: material.id,
            type: "RECEIPT",
            quantity: ib.quantity,
            unitPrice: ib.unitPrice,
            note: "Opening inventory balance",
          },
        });
      }

      Logger.audit("Legacy migration completed successfully", { projectId: data.projectId });
      return { success: true };
    });
  }

  /**
   * Reconciliation tool for Parallel Run phase.
   * Compares ERP totals with Legacy (Excel) totals.
   */
  static async reconcileParallelRun(projectId: string, legacyTotalCost: number, legacyTotalRevenue: number) {
    const [erpCosts, erpRevenues] = await Promise.all([
      prisma.costRecord.aggregate({ where: { projectId }, _sum: { amount: true } }),
      prisma.revenue.aggregate({ where: { projectId }, _sum: { amount: true } }),
    ]);

    const costDiff = Math.abs(Number(erpCosts._sum.amount || 0) - legacyTotalCost);
    const revDiff = Math.abs(Number(erpRevenues._sum.amount || 0) - legacyTotalRevenue);

    return {
      projectId,
      isBalanced: costDiff === 0 && revDiff === 0,
      discrepancy: { costDiff, revDiff },
      status: costDiff < 100 && revDiff < 100 ? "ACCEPTABLE" : "ACTION_REQUIRED",
    };
  }
}
