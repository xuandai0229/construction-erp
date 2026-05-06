import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit.service";

export type CloseCheckItem = {
  category: string;
  item: string;
  status: "CLEAR" | "BLOCKING" | "WARNING";
  count?: number;
  detail?: string;
};

export class CloseManagementService {
  /**
   * Run a full pre-close validation scan for a given period (YYYY-MM).
   * Returns a structured checklist that must be 100% CLEAR before CFO sign-off.
   */
  static async runPreCloseChecklist(period: string): Promise<CloseCheckItem[]> {
    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 1); // exclusive

    const checklist: CloseCheckItem[] = [];

    // ── 1. AP: Unposted / Unapproved Purchase Orders ────────────────────────
    const pendingPOs = await prisma.purchaseOrder.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED"] },
        createdAt: { gte: periodStart, lt: periodEnd },
        deletedAt: null,
      },
    });
    checklist.push({
      category: "AP",
      item: "Unposted Purchase Orders",
      status: pendingPOs > 0 ? "BLOCKING" : "CLEAR",
      count: pendingPOs,
      detail: pendingPOs > 0 ? `${pendingPOs} PO(s) still DRAFT/SUBMITTED in period` : undefined,
    });

    // ── 2. AR: Uninvoiced Progress Entries (WIP not billed) ─────────────────
    const unbilledProgress = await prisma.progressEntry.count({
      where: {
        status: "VERIFIED",
        date: { gte: periodStart, lt: periodEnd },
      },
    });
    checklist.push({
      category: "AR / WIP",
      item: "Verified Progress Entries Not Yet Invoiced",
      status: unbilledProgress > 0 ? "WARNING" : "CLEAR",
      count: unbilledProgress,
      detail: unbilledProgress > 0
        ? `${unbilledProgress} entries VERIFIED but no invoice raised — accrual required`
        : undefined,
    });

    // ── 3. APPROVALS: Stale approval requests older than 48h ────────────────
    const cutoff48h = new Date(periodEnd.getTime() - 48 * 60 * 60 * 1000);
    const staleApprovals = await prisma.approvalRequest.count({
      where: {
        status: "PENDING",
        createdAt: { gte: periodStart, lt: cutoff48h },
      },
    });
    checklist.push({
      category: "Governance",
      item: "Stale Approval Requests (>48h pending)",
      status: staleApprovals > 0 ? "BLOCKING" : "CLEAR",
      count: staleApprovals,
      detail: staleApprovals > 0 ? `${staleApprovals} approvals stalled — must resolve before close` : undefined,
    });

    // ── 4. JOURNALS: Unbalanced journal entries ──────────────────────────────
    // A well-formed journal: SUM(DEBIT lines) == SUM(CREDIT lines)
    const journalsInPeriod = await prisma.journalEntry.findMany({
      where: {
        date: { gte: periodStart, lt: periodEnd },
        isPosted: true,
        deletedAt: null,
      },
      include: { lines: true },
    });

    const unbalancedJournals = journalsInPeriod.filter((je) => {
      const debits  = je.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
      const credits = je.lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
      return Math.abs(debits - credits) > 0.01; // tolerance: 1 cent
    });
    checklist.push({
      category: "Ledger",
      item: "Unbalanced Journal Entries",
      status: unbalancedJournals.length > 0 ? "BLOCKING" : "CLEAR",
      count: unbalancedJournals.length,
      detail: unbalancedJournals.length > 0
        ? `IDs: ${unbalancedJournals.slice(0, 3).map(j => j.id.slice(0, 8)).join(", ")}…`
        : undefined,
    });

    // ── 5. INVOICES: Overdue invoices not yet followed up ───────────────────
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: "OVERDUE",
        dueDate: { lt: periodEnd },
        deletedAt: null,
      },
    });
    checklist.push({
      category: "AR",
      item: "Overdue Invoices (Collection Risk)",
      status: overdueInvoices > 0 ? "WARNING" : "CLEAR",
      count: overdueInvoices,
    });

    // ── 6. SUBCONTRACTS: Uninvoiced subcontract progress ────────────────────
    const uninvoicedSubProgress = await prisma.subcontractProgress.count({
      where: {
        status: "CERTIFIED",
        date: { gte: periodStart, lt: periodEnd },
      },
    });
    checklist.push({
      category: "Subcontract",
      item: "Certified Subcontract Progress Not Invoiced",
      status: uninvoicedSubProgress > 0 ? "WARNING" : "CLEAR",
      count: uninvoicedSubProgress,
      detail: uninvoicedSubProgress > 0 ? "Accrual likely required" : undefined,
    });

    return checklist;
  }

  /**
   * Lock a fiscal period.
   * BLOCKING: Refuses to lock if any BLOCKING items remain in the checklist.
   * Records the lock action immutably in AuditLog.
   */
  static async lockPeriod(params: {
    period: string;
    lockedById: string;
    cfoCertification: boolean;
  }) {
    if (!params.cfoCertification) {
      throw new Error("CFO certification required before period lock.");
    }

    const checklist = await this.runPreCloseChecklist(params.period);
    const blockers  = checklist.filter(c => c.status === "BLOCKING");
    if (blockers.length > 0) {
      throw new Error(
        `Cannot lock period ${params.period}: ${blockers.length} BLOCKING issue(s) remain — ` +
        blockers.map(b => b.item).join("; ")
      );
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.fiscalPeriod.findUnique({ where: { month: params.period } });
      if (existing?.isLocked) {
        throw new Error(`Period ${params.period} is already locked.`);
      }

      const fp = await tx.fiscalPeriod.upsert({
        where:  { month: params.period },
        create: {
          month:       params.period,
          isLocked:    true,
          lockedAt:    new Date(),
          lockedById:  params.lockedById,
          reconciledAt: new Date(),
        },
        update: {
          isLocked:    true,
          lockedAt:    new Date(),
          lockedById:  params.lockedById,
          reconciledAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId:    params.lockedById,
          action:    "PERIOD_LOCK",
          entity:    "FiscalPeriod",
          entityId:  fp.id,
          newData:   { period: params.period, cfoCertified: true },
          reason:    `CFO certified and locked period ${params.period}`,
          severity:  "CRITICAL",
        },
      });

      return fp;
    });
  }

  /**
   * Guard: enforce immutability — any mutation service should call this before posting.
   */
  static async assertPeriodOpen(date: Date) {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const fp    = await prisma.fiscalPeriod.findUnique({ where: { month } });
    if (fp?.isLocked) {
      throw new Error(
        `Period ${month} is LOCKED. All postings are prohibited. ` +
        `Contact CFO to request a period re-opening.`
      );
    }
  }
}
