import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { CloseManagementService } from "./closeManagement.service";

export type AccrualType =
  | "GRNI"                 // Goods Received Not Invoiced
  | "SUBCONTRACT_PROGRESS" // Subcontract work done, not yet invoiced
  | "WIP_REVENUE"          // Progress certified, invoice not raised
  | "RETENTION"            // Retention held accrual
  | "RECURRING";           // Fixed monthly accrual (rent, insurance, etc.)

export interface AccrualEntry {
  type:        AccrualType;
  projectId:   string;
  description: string;
  amount:      Decimal;
  period:      string;  // YYYY-MM
  sourceId?:   string;  // GRN id, Subcontract id, etc.
  autoReverse: boolean; // True → system creates reversal on day 1 of next period
}

export class AccrualManagementService {
  /**
   * Post an accrual journal entry and (optionally) schedule its auto-reversal.
   * Enforces: period must be open, double-entry is balanced.
   *
   * Debit:  Expense / WIP account
   * Credit: Accrued Liabilities account
   */
  static async postAccrual(accrual: AccrualEntry, postedById: string) {
    // 1. Period guard
    const [year, month] = accrual.period.split("-").map(Number);
    await CloseManagementService.assertPeriodOpen(new Date(year, month - 1, 1));

    // 2. Resolve ledger accounts
    const expenseAccount  = await prisma.ledgerAccount.findFirst({ where: { code: "5000", isActive: true } });
    const accrualAccount  = await prisma.ledgerAccount.findFirst({ where: { code: "3300", isActive: true } });

    if (!expenseAccount || !accrualAccount) {
      throw new Error("Chart of accounts not configured: accounts 5000 (Expense) and 3300 (Accrued Liabilities) are required.");
    }

    return prisma.$transaction(async (tx) => {
      // 3. Post double-entry journal
      const journal = await tx.journalEntry.create({
        data: {
          projectId:   accrual.projectId,
          description: `[ACCRUAL] ${accrual.type} — ${accrual.description}`,
          reference:   `ACC-${accrual.period}-${accrual.sourceId ?? "MANUAL"}`,
          sourceType:  "ACCRUAL",
          sourceId:    accrual.sourceId,
          isPosted:    true,
          lines: {
            create: [
              { accountId: expenseAccount.id, amount: accrual.amount, type: "DEBIT",  description: accrual.description },
              { accountId: accrualAccount.id, amount: accrual.amount, type: "CREDIT", description: accrual.description },
            ],
          },
        },
      });

      // 4. Schedule auto-reversal (day 1 of next period)
      if (accrual.autoReverse) {
        const nextMonth    = new Date(year, month, 1); // month+1 because month is 0-indexed
        const reversalPeriod = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

        // Store reversal metadata in AuditLog for the nightly close job to pick up
        await tx.auditLog.create({
          data: {
            userId:    postedById,
            action:    "ACCRUAL_REVERSAL_SCHEDULED",
            entity:    "JournalEntry",
            entityId:  journal.id,
            newData:   { reversalPeriod, originalJournalId: journal.id, amount: accrual.amount },
            reason:    `Auto-reversal scheduled for ${reversalPeriod}`,
            severity:  "INFO",
          },
        });
      }

      // 5. Immutable audit trail
      await tx.auditLog.create({
        data: {
          userId:    postedById,
          action:    "ACCRUAL_POSTED",
          entity:    "JournalEntry",
          entityId:  journal.id,
          newData:   { type: accrual.type, amount: accrual.amount, period: accrual.period },
          severity:  "INFO",
        },
      });

      return journal;
    });
  }

  /**
   * WIP Revenue Recognition (Percentage-of-Completion):
   * Calculates the revenue earned to date and the amount not yet billed (unbilled AR).
   */
  static async recognizeWIPRevenue(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { contractValue: true },
    });
    if (!project) throw new Error("Project not found");

    const verifiedProgress = await prisma.progressEntry.findMany({
      where: { boqItem: { projectId }, status: { in: ["VERIFIED", "INVOICED"] } },
      select: { amount: true, status: true },
    });

    const earnedTotal   = verifiedProgress.reduce((s, p) => s.add(p.amount), new Decimal(0));
    const invoicedTotal = verifiedProgress
      .filter(p => p.status === "INVOICED")
      .reduce((s, p) => s.add(p.amount), new Decimal(0));

    const unbilledAR    = earnedTotal.sub(invoicedTotal);
    const pocPercent    = project.contractValue.gt(0)
      ? earnedTotal.div(project.contractValue).mul(100)
      : new Decimal(0);

    return {
      projectId,
      contractValue:  project.contractValue,
      earnedToDate:   earnedTotal,
      invoicedToDate: invoicedTotal,
      unbilledAR,
      pocPercent:     pocPercent.toFixed(2) + "%",
      accrualRequired: unbilledAR.gt(0),
    };
  }
}
