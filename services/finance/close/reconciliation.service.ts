import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export type ReconItem = {
  id: string;
  type: "BANK" | "INTERCOMPANY" | "AR" | "AP" | "RETENTION" | "SUBCONTRACT";
  referenceId: string;
  description: string;
  amount: Decimal;
  status: "MATCHED" | "UNMATCHED" | "DISPUTED" | "IN_PROGRESS";
  agingDays: number;
};

export class ReconciliationService {
  /**
   * Bank Reconciliation:
   * Compares Payment records in the ledger against an imported bank statement.
   * Returns matched/unmatched items for the Finance team to resolve.
   */
  static async runBankReconciliation(
    projectId: string,
    period: string,
    bankStatementItems: { ref: string; amount: number; date: string }[]
  ) {
    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 1);

    const erp_payments = await prisma.payment.findMany({
      where: {
        projectId,
        date: { gte: periodStart, lt: periodEnd },
        deletedAt: null,
      },
      select: { id: true, amount: true, description: true, date: true },
    });

    const matched:   typeof erp_payments = [];
    const unmatched: typeof erp_payments = [];

    for (const payment of erp_payments) {
      const bankEntry = bankStatementItems.find(
        b => Math.abs(b.amount - Number(payment.amount)) < 0.01
      );
      if (bankEntry) matched.push(payment);
      else           unmatched.push(payment);
    }

    return {
      period,
      projectId,
      totalERPPayments: erp_payments.length,
      matchedCount:     matched.length,
      unmatchedCount:   unmatched.length,
      matchRate:        erp_payments.length > 0
                          ? ((matched.length / erp_payments.length) * 100).toFixed(1) + "%"
                          : "N/A",
      unmatchedItems: unmatched.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        description: p.description,
        agingDays: Math.floor((Date.now() - p.date.getTime()) / 86400000),
      })),
    };
  }

  /**
   * Retention Reconciliation:
   * Verifies that total retention held per project matches the sum of retentionAmount
   * across all posted invoices minus any retention already released.
   */
  static async runRetentionReconciliation(projectId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, retentionAmount: true, status: true },
    });

    const totalHeld     = invoices.reduce((sum, i) => sum.add(i.retentionAmount), new Decimal(0));
    const paidInvoices  = invoices.filter(i => i.status === "PAID");
    const releasable    = paidInvoices.reduce((sum, i) => sum.add(i.retentionAmount), new Decimal(0));

    return {
      projectId,
      totalRetentionHeld:     totalHeld,
      potentiallyReleasable:  releasable,
      outstandingRetention:   totalHeld.sub(releasable),
      invoiceCount:           invoices.length,
      status: totalHeld.gt(0) ? "OPEN" : "CLEAR",
    };
  }

  /**
   * AP Reconciliation:
   * Checks for any PO that has GRN received but no matching CostRecord posted.
   * These are "goods received, not invoiced" (GRNI) — require accrual.
   */
  static async runGRNIReconciliation(projectId: string) {
    const receipts = await prisma.goodsReceipt.findMany({
      where: { projectId, deletedAt: null },
      include: { purchaseOrder: { include: { costRecords: true } } },
    });

    const grniItems = receipts.filter(
      grn => grn.purchaseOrder.costRecords.length === 0
    );

    return {
      projectId,
      totalGRNs:    receipts.length,
      grniCount:    grniItems.length,
      grniItems:    grniItems.map(g => ({
        grnId:   g.id,
        poId:    g.purchaseOrderId,
        date:    g.receivedDate,
        agingDays: Math.floor((Date.now() - g.receivedDate.getTime()) / 86400000),
      })),
      status: grniItems.length > 0 ? "ACCRUAL_REQUIRED" : "CLEAR",
    };
  }
}
