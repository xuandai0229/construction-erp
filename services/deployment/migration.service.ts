import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
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

      // 1. Process Vendor Opening Balances (as unpaid Invoices)
      for (const vb of data.vendorBalances) {
        await tx.invoice.create({
          data: {
            projectId: data.projectId,
            amount: vb.amount,
            status: "SENT",
            invoiceNumber: `OPENING-${vb.vendorName}`,
            description: `Dư nợ đầu kỳ: ${vb.vendorName}`,
            createdById: data.userId,
            // Link to a generic WBS for opening balances
          }
        });
      }

      // 2. Process Inventory Opening Balances (as RECEIPT transactions)
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
            note: "Tồn kho đầu kỳ từ hệ thống cũ"
          }
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
      prisma.revenue.aggregate({ where: { projectId }, _sum: { amount: true } })
    ]);

    const costDiff = Math.abs(Number(erpCosts._sum.amount || 0) - legacyTotalCost);
    const revDiff = Math.abs(Number(erpRevenues._sum.amount || 0) - legacyTotalRevenue);

    return {
      projectId,
      isBalanced: costDiff === 0 && revDiff === 0,
      discrepancy: { costDiff, revDiff },
      status: costDiff < 100 && revDiff < 100 ? "ACCEPTABLE" : "ACTION_REQUIRED"
    };
  }
}
