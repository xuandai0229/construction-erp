import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "./audit.service";

export class OperationalService {
  /**
   * Checks if a specific date falls within a locked fiscal period.
   */
  static async isPeriodLocked(date: Date): Promise<boolean> {
    const month = date.toISOString().substring(0, 7); // YYYY-MM
    const period = await prisma.fiscalPeriod.findUnique({
      where: { month }
    });
    return period?.isLocked || false;
  }

  /**
   * Locks a fiscal period.
   */
  static async lockPeriod(month: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const period = await tx.fiscalPeriod.upsert({
        where: { month },
        create: { month, isLocked: true, lockedAt: new Date(), lockedById: userId },
        update: { isLocked: true, lockedAt: new Date(), lockedById: userId }
      });

      await AuditService.log({
        tx,
        userId,
        action: "UPDATE",
        entity: "FiscalPeriod",
        entityId: period.id,
        newData: period,
        reason: `Chốt sổ kỳ kế toán ${month}`,
        severity: "CRITICAL"
      });

      return period;
    });
  }

  /**
   * Performs a comprehensive ledger reconciliation.
   * 1. Check if sum(lines) per journal entry is zero.
   * 2. Check if total debit equals total credit.
   * 3. Check for orphaned transaction lines.
   */
  static async reconcileLedger() {
    const results = {
      imbalancedEntries: [] as string[],
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: false,
      orphanedLines: 0
    };

    // 1. Check imbalanced journal entries
    const entries = await prisma.journalEntry.findMany({
      include: { lines: true }
    });

    entries.forEach(entry => {
      const balance = entry.lines.reduce((sum, line) => {
        const amount = Number(line.amount);
        return sum + (line.type === "DEBIT" ? amount : -amount);
      }, 0);

      if (Math.abs(balance) > 0.01) {
        results.imbalancedEntries.push(entry.id);
      }
    });

    // 2. Total totals
    const aggregates = await prisma.transactionLine.groupBy({
      by: ['type'],
      _sum: { amount: true }
    });

    aggregates.forEach(agg => {
      if (agg.type === "DEBIT") results.totalDebit = Number(agg._sum.amount || 0);
      if (agg.type === "CREDIT") results.totalCredit = Number(agg._sum.amount || 0);
    });

    results.isBalanced = Math.abs(results.totalDebit - results.totalCredit) < 0.01;

    // 3. Orphaned lines (lines without journal entry)
    results.orphanedLines = await prisma.transactionLine.count({
      where: { journalEntry: { is: null } }
    });

    return results;
  }

  /**
   * Financial Health Check
   */
  static async getHealthStatus() {
    const [reconciliation, lockedPeriods] = await Promise.all([
      this.reconcileLedger(),
      prisma.fiscalPeriod.count({ where: { isLocked: true } })
    ]);

    return {
      status: reconciliation.isBalanced && reconciliation.imbalancedEntries.length === 0 ? "HEALTHY" : "CRITICAL",
      reconciliation,
      lockedPeriods,
      timestamp: new Date()
    };
  }
}
