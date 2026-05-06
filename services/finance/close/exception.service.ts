import { prisma } from "@/lib/prisma";

export type ExceptionSeverity = "CRITICAL" | "HIGH" | "MEDIUM";

export interface AccountingException {
  id:           string;
  severity:     ExceptionSeverity;
  category:     string;
  description:  string;
  projectId?:   string;
  entityType?:  string;
  entityId?:    string;
  detectedAt:   Date;
  agingDays:    number;
  status:       "OPEN" | "IN_PROGRESS" | "RESOLVED";
}

export class ExceptionGovernanceService {
  /**
   * Enterprise-wide exception scan.
   * Detects accounting control violations that must be resolved outside of close.
   * This runs as a scheduled job (daily), not on-demand.
   */
  static async scanForExceptions(): Promise<AccountingException[]> {
    const exceptions: AccountingException[] = [];
    const now = Date.now();

    // ── 1. BACKDATED POSTINGS (journal posted > 5 days after its stated date) ──
    const cutoff = new Date(Date.now() - 5 * 86400000);
    const backdated = await prisma.journalEntry.findMany({
      where: {
        isPosted: true,
        deletedAt: null,
        date: { lt: cutoff },
        createdAt: { gt: cutoff }, // created recently but dated in the past
      },
      select: { id: true, projectId: true, date: true, createdAt: true, description: true },
      take: 50,
    });

    for (const je of backdated) {
      const lag = Math.floor((je.createdAt.getTime() - je.date.getTime()) / 86400000);
      if (lag > 5) {
        exceptions.push({
          id:          `EXC-BD-${je.id.slice(0, 8)}`,
          severity:    lag > 30 ? "CRITICAL" : "HIGH",
          category:    "Backdated Posting",
          description: `Journal entry ${je.id.slice(0, 8)} is dated ${lag} days before posting. Description: "${je.description}"`,
          projectId:   je.projectId ?? undefined,
          entityType:  "JournalEntry",
          entityId:    je.id,
          detectedAt:  new Date(),
          agingDays:   0,
          status:      "OPEN",
        });
      }
    }

    // ── 2. SEGREGATION OF DUTY VIOLATIONS (same user requests AND approves) ──
    const sodViolations = await prisma.approvalRequest.findMany({
      where: { status: "APPROVED" },
      include: { steps: { where: { status: "APPROVED" } } },
      take: 200,
    });

    for (const req of sodViolations) {
      const approverIds = req.steps.map(s => s.approverId);
      if (approverIds.includes(req.requesterId)) {
        exceptions.push({
          id:          `EXC-SOD-${req.id.slice(0, 8)}`,
          severity:    "CRITICAL",
          category:    "SOD Violation",
          description: `ApprovalRequest ${req.id.slice(0, 8)}: requester (${req.requesterId.slice(0, 8)}) also approved their own request.`,
          projectId:   req.projectId,
          entityType:  "ApprovalRequest",
          entityId:    req.id,
          detectedAt:  new Date(),
          agingDays:   Math.floor((now - req.createdAt.getTime()) / 86400000),
          status:      "OPEN",
        });
      }
    }

    // ── 3. DUPLICATE PAYMENT DETECTION ───────────────────────────────────────
    // Payments: same invoiceId + same amount within 7 days = suspected duplicate
    const payments = await prisma.payment.findMany({
      where: { deletedAt: null },
      select: { id: true, invoiceId: true, amount: true, date: true, projectId: true },
      orderBy: { date: "asc" },
    });

    const seen = new Map<string, typeof payments[0]>();
    for (const p of payments) {
      const key = `${p.invoiceId}-${p.amount}`;
      const prev = seen.get(key);
      if (prev) {
        const daysDiff = Math.abs(p.date.getTime() - prev.date.getTime()) / 86400000;
        if (daysDiff <= 7) {
          exceptions.push({
            id:          `EXC-DUP-${p.id.slice(0, 8)}`,
            severity:    "CRITICAL",
            category:    "Duplicate Payment",
            description: `Potential duplicate: Payment ${p.id.slice(0, 8)} matches ${prev.id.slice(0, 8)} (same invoice, same amount, ${daysDiff.toFixed(0)} days apart)`,
            projectId:   p.projectId,
            entityType:  "Payment",
            entityId:    p.id,
            detectedAt:  new Date(),
            agingDays:   Math.floor((now - p.date.getTime()) / 86400000),
            status:      "OPEN",
          });
        }
      } else {
        seen.set(key, p);
      }
    }

    // ── 4. ABNORMAL MARGIN — project cost > contract value ───────────────────
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, status: { in: ["ACTIVE", "IN_PROGRESS"] } },
      select: { id: true, name: true, contractValue: true, totalBudget: true },
    });

    for (const p of projects) {
      const costAgg = await prisma.costRecord.aggregate({
        where: { projectId: p.id, deletedAt: null },
        _sum: { amount: true },
      });
      const totalCost = costAgg._sum.amount ?? 0;
      if (Number(totalCost) > Number(p.contractValue) * 1.05) { // 5% overrun threshold
        exceptions.push({
          id:          `EXC-MARGIN-${p.id.slice(0, 8)}`,
          severity:    "HIGH",
          category:    "Margin Anomaly",
          description: `Project "${p.name}": Cost ${Number(totalCost).toLocaleString()} exceeds contract value ${Number(p.contractValue).toLocaleString()} by >5%.`,
          projectId:   p.id,
          entityType:  "Project",
          entityId:    p.id,
          detectedAt:  new Date(),
          agingDays:   0,
          status:      "OPEN",
        });
      }
    }

    return exceptions.sort((a, b) => {
      const order: Record<ExceptionSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return order[a.severity] - order[b.severity];
    });
  }
}

export class FinanceOperationalAnalyticsService {
  /**
   * Close Performance KPIs — measures how disciplined the finance team is.
   */
  static async getCloseKPIs(period: string) {
    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 1);

    const fp = await prisma.fiscalPeriod.findUnique({ where: { month: period } });

    // Close duration: from period start to lock date
    const closeDurationDays = fp?.lockedAt
      ? Math.floor((fp.lockedAt.getTime() - periodStart.getTime()) / 86400000) - (month === 1 ? 31 : 30) // days after period end
      : null;

    // Manual journal ratio: journals with sourceType = null (manual) vs total
    const totalJournals  = await prisma.journalEntry.count({ where: { date: { gte: periodStart, lt: periodEnd }, isPosted: true } });
    const manualJournals = await prisma.journalEntry.count({ where: { date: { gte: periodStart, lt: periodEnd }, isPosted: true, sourceType: null } });
    const manualRatio    = totalJournals > 0 ? ((manualJournals / totalJournals) * 100).toFixed(1) : "0";

    // Late approvals
    const lateApprovals = await prisma.approvalStep.count({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    });

    return {
      period,
      periodLocked:       fp?.isLocked ?? false,
      closeDurationDays,                                  // null if not yet closed
      manualJournalRatio: manualRatio + "%",              // target: <20%
      lateApprovals,                                      // target: 0
      reconciledAt:       fp?.reconciledAt ?? null,
      totalJournalsPosted: totalJournals,
    };
  }
}
