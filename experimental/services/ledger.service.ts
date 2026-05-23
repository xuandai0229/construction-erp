import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { AuditService } from "../audit.service";
import { AccountingGovernance } from "./accounting-governance";

export interface LedgerEntryDTO {
  projectId?: string;
  companyId?: string;
  date: Date;
  description: string;
  sourceType: string; // e.g. "COST", "INVOICE"
  sourceId: string;
  lines: { accountId: string; amount: number; type: "DEBIT" | "CREDIT" }[];
  actor: string;
}

/**
 * Enterprise Immutable Ledger Service
 * Enforces append-only accounting logic. Replaces direct UPDATE/DELETE 
 * with Reversal and Adjustment entries.
 */
export class LedgerService {
  static async postEntry(data: LedgerEntryDTO) {
    // 1. Governance check
    await AccountingGovernance.assertPeriodIsOpen(data.date, data.companyId);

    // 2. Append-only write
    const entry = await prisma.journalEntry.create({
      data: {
        projectId: data.projectId,
        date: data.date,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        isPosted: true,
        lines: {
          create: data.lines.map(line => ({
            accountId: line.accountId,
            amount: line.amount,
            type: line.type
          }))
        }
      },
      include: { lines: true }
    });

    LoggerService.info(`[LedgerService] Posted Journal Entry ${entry.id}`, { sourceType: data.sourceType, sourceId: data.sourceId });
    return entry;
  }

  static async reverseEntry(originalSourceId: string, actor: string, reason: string) {
    const original = await prisma.journalEntry.findFirst({
      where: { sourceId: originalSourceId, isReversed: false },
      include: { lines: true }
    });

    if (!original) throw new Error("Journal Entry not found or already reversed.");

    // Even reversals must happen in an OPEN period
    await AccountingGovernance.assertPeriodIsOpen(new Date());

    // Create Reversal Entry
    const reversal = await prisma.journalEntry.create({
      data: {
        projectId: original.projectId,
        date: new Date(),
        description: `REVERSAL of ${original.sourceType} ${original.sourceId}: ${reason}`,
        sourceType: "REVERSAL",
        sourceId: original.sourceId,
        isReversed: false,
        reversalRef: original.id,
        reversedById: actor,
        lines: {
          create: original.lines.map(line => ({
            accountId: line.accountId,
            amount: line.amount,
            type: line.type === "DEBIT" ? "CREDIT" : "DEBIT" // Reverse signs
          }))
        }
      }
    });

    // Mark original as reversed
    await prisma.journalEntry.update({
      where: { id: original.id },
      data: { isReversed: true, reversedById: actor }
    });

    await AuditService.log({
      action: "REVERSE",
      entity: "JournalEntry",
      entityId: original.id,
      userId: actor,
      reason,
      severity: "WARNING"
    });

    return reversal;
  }
}
