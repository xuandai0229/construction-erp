
import { prisma } from "../lib/prisma";
import { round } from "../lib/math";

export interface ReconciliationResult {
  passed: boolean;
  issues: string[];
  governance?: any;
}

export class DiagnosticsService {
  /**
   * Performs full accounting reconciliation for a project
   */
  static async reconcileProject(projectId: string): Promise<ReconciliationResult> {
    const issues: string[] = [];
    
    // 1. Invoice vs Payments
    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } }
    });

    for (const inv of invoices) {
      const paymentSum = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      if (round(paymentSum) !== round(Number(inv.paidAmount))) {
        issues.push(`Invoice ${inv.invoiceNumber || inv.id}: Paid amount mismatch. DB: ${inv.paidAmount}, Payments Sum: ${paymentSum}`);
      }
      
      const expectedRemaining = round(Number(inv.amount) - paymentSum);
      if (round(Number(inv.remainingAmount)) !== expectedRemaining) {
        issues.push(`Invoice ${inv.invoiceNumber || inv.id}: Remaining amount mismatch. DB: ${inv.remainingAmount}, Expected: ${expectedRemaining}`);
      }

      if (inv.status === "PAID" && expectedRemaining > 0) {
        issues.push(`Invoice ${inv.invoiceNumber || inv.id}: Marked PAID but has remaining balance ${expectedRemaining}`);
      }
    }

    // 2. Dashboard consistency (Revenue check)
    const invoiceAgg = await prisma.invoice.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });
    
    const revenueAgg = await prisma.revenue.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });

    // Note: In our accrual model, Revenue should equal total Invoiced amount.
    // If we use Revenue records for cash, then it should match payments.
    // Currently our Revenue records are created on Payment.
    const paymentAgg = await prisma.payment.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { amount: true }
    });

    if (round(Number(revenueAgg._sum?.amount || 0)) !== round(Number(paymentAgg._sum?.amount || 0))) {
      issues.push(`Project ${projectId}: Revenue records mismatch Payment records.`);
    }

    const governance: any = {
      reversalCount: 0,
      restoreCount: 0,
      lockedPeriodViolations: 0
    };

    // 3. Governance: Count reversals
    governance.reversalCount = await prisma.journalEntry.count({
      where: { projectId, isReversed: true }
    });

    // 4. Governance: Count restores (from AuditLog)
    governance.restoreCount = await prisma.auditLog.count({
      where: { 
        entity: "Invoice", 
        reason: { contains: "Khôi phục" } 
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      governance
    };
  }

  /**
   * Scans system for health issues
   */
  static async systemHealthCheck() {
    const results: any = {
      orphans: [],
      inconsistencies: [],
      integrity: []
    };

    // 1. Orphan Journal Entries (POSTED without source)
    const journals = await prisma.journalEntry.findMany({
      where: { deletedAt: null }
    });

    for (const j of journals) {
      if (!j.sourceId) continue;
      
      let sourceExists = false;
      if (j.sourceType === "COST") {
        sourceExists = !!(await prisma.costRecord.findUnique({ where: { id: j.sourceId } }));
      } else if (j.sourceType === "INVOICE") {
        sourceExists = !!(await prisma.invoice.findUnique({ where: { id: j.sourceId } }));
      } else if (j.sourceType === "PAYMENT") {
        sourceExists = !!(await prisma.payment.findUnique({ where: { id: j.sourceId } }));
      }

      if (!sourceExists) {
        results.orphans.push(`Journal ${j.id} (${j.sourceType}) has no matching source record ${j.sourceId}`);
      }
    }

    // 2. Missing Reversals for soft-deleted documents
    // Bypass soft-delete filter using raw query
    const deletedInvoices: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Invoice" WHERE "deletedAt" IS NOT NULL`);
    for (const inv of deletedInvoices) {
      const reversal = await prisma.journalEntry.findFirst({
        where: { sourceId: inv.id, sourceType: "INVOICE", isReversed: true }
      });
      if (!reversal) {
        results.integrity.push(`Deleted Invoice ${inv.id} is missing a reversal journal entry.`);
      }
    }

    // 3. Stale Aggregates (Invoices with incorrect paidAmount)
    // (This is covered by reconcileProject but we can do a global scan here if needed)

    return results;
  }
}
