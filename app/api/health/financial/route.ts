import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { ReconciliationService } from "@/services/reconciliation.service";
import { requireAdmin } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get("details") === "true";

    if (!includeDetails) {
      const [
        projectCount,
        costCount,
        invoiceCount,
        unbalancedJournals,
        inconsistentCosts,
        inconsistentInvoices,
        orphanTransactionLines,
        staleProjectBudgets,
        lockedPeriods,
      ] = await Promise.all([
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.costRecord.count({ where: { deletedAt: null } }),
        prisma.invoice.count({ where: { deletedAt: null } }),
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM (
            SELECT je.id,
              COALESCE(SUM(CASE WHEN tl.type = 'DEBIT' THEN tl.amount ELSE 0 END), 0) AS debits,
              COALESCE(SUM(CASE WHEN tl.type = 'CREDIT' THEN tl.amount ELSE 0 END), 0) AS credits
            FROM "JournalEntry" je
            LEFT JOIN "TransactionLine" tl ON tl."journalEntryId" = je.id AND tl."deletedAt" IS NULL
            WHERE je."deletedAt" IS NULL
            GROUP BY je.id
          ) x
          WHERE ABS((x.debits - x.credits)::numeric) > 1
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM "CostRecord"
          WHERE "deletedAt" IS NULL AND (
            amount <= 0 OR "netAmount" < 0 OR "vatAmount" < 0 OR ABS((amount - ("netAmount" + "vatAmount"))::numeric) > 1
          )
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM "Invoice"
          WHERE "deletedAt" IS NULL AND (
            amount <= 0 OR "paidAmount" < 0 OR "remainingAmount" < 0
            OR ABS((amount - ("netAmount" + "vatAmount"))::numeric) > 1
            OR ABS(("remainingAmount" - GREATEST(0, amount - "paidAmount"))::numeric) > 1
          )
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM "TransactionLine" tl
          LEFT JOIN "JournalEntry" je ON je.id = tl."journalEntryId"
          WHERE tl."deletedAt" IS NULL AND (je.id IS NULL OR je."deletedAt" IS NOT NULL)
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*)::int AS count
          FROM "Project" p
          LEFT JOIN (
            SELECT "projectId", COALESCE(SUM("estimatedAmount"), 0) AS budget
            FROM "BudgetRecord"
            WHERE "deletedAt" IS NULL
            GROUP BY "projectId"
          ) b ON b."projectId" = p.id
          WHERE p."deletedAt" IS NULL
            AND ABS((p."totalBudget" - COALESCE(b.budget, 0))::numeric) > 1
        `,
        prisma.fiscalPeriod.count({ where: { isLocked: true } }),
      ]);

      const data = {
        mode: "summary",
        projectCount,
        costCount,
        invoiceCount,
        unbalancedJournalEntries: unbalancedJournals[0]?.count ?? 0,
        inconsistentCosts: inconsistentCosts[0]?.count ?? 0,
        inconsistentInvoices: inconsistentInvoices[0]?.count ?? 0,
        orphanTransactionLines: orphanTransactionLines[0]?.count ?? 0,
        staleProjectBudgets: staleProjectBudgets[0]?.count ?? 0,
        lockedPeriods,
        isHealthy:
          (unbalancedJournals[0]?.count ?? 0) === 0 &&
          (inconsistentCosts[0]?.count ?? 0) === 0 &&
          (inconsistentInvoices[0]?.count ?? 0) === 0 &&
          (orphanTransactionLines[0]?.count ?? 0) === 0 &&
          (staleProjectBudgets[0]?.count ?? 0) === 0,
      };
      return successResponse(data);
    }

    const data = await ReconciliationService.runGlobalReconciliation();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
