import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CloseManagementService } from "@/services/finance/close/closeManagement.service";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/cron/accrual-reversals
 * Nightly cron job that scans for pending accrual reversals meant for the current month.
 */
export async function POST(req: NextRequest) {
  // Simple auth to prevent public triggering
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_cron_secret'}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  try {
    // 1. Guard: Check if the current period is open before attempting postings
    await CloseManagementService.assertPeriodOpen(now);

    // 2. Find pending auto-reversals scheduled for the current period
    const pendingReversals = await prisma.auditLog.findMany({
      where: {
        action: "ACCRUAL_REVERSAL_SCHEDULED",
        // The metadata schema defines `reversalPeriod` on newData
        newData: { path: ["reversalPeriod"], equals: currentPeriod },
      },
    });

    if (pendingReversals.length === 0) {
      return NextResponse.json({ success: true, message: `No pending reversals for period ${currentPeriod}` });
    }

    const processedIds: string[] = [];
    const errors: string[] = [];

    // 3. Process each reversal
    for (const log of pendingReversals) {
      const data = log.newData as any;
      if (!data || !data.originalJournalId || !data.amount) continue;

      try {
        await prisma.$transaction(async (tx) => {
          // Fetch the original journal to invert its lines
          const originalJournal = await tx.journalEntry.findUnique({
            where: { id: data.originalJournalId },
            include: { lines: true },
          });

          if (!originalJournal) throw new Error("Original journal not found");

          // Post the reversal journal
          const reversalJournal = await tx.journalEntry.create({
            data: {
              projectId: originalJournal.projectId,
              description: `[REVERSAL] Auto-reversal of ${originalJournal.reference}`,
              reference: `REV-${originalJournal.id.slice(0, 8)}`,
              sourceType: "ACCRUAL_REVERSAL",
              sourceId: originalJournal.id,
              isPosted: true,
              date: now,
              lines: {
                create: originalJournal.lines.map(line => ({
                  accountId: line.accountId,
                  amount: line.amount,
                  type: line.type === "DEBIT" ? "CREDIT" : "DEBIT", // Invert double-entry
                  description: `Reversal: ${line.description}`,
                })),
              },
            },
          });

          // Mark the scheduled reversal as processed by mutating the audit log
          // (In a real system, a dedicated job queue table is better, but this fits the current architecture)
          await tx.auditLog.update({
            where: { id: log.id },
            data: { action: "ACCRUAL_REVERSAL_PROCESSED" },
          });

          processedIds.push(reversalJournal.id);
        });
      } catch (err: any) {
        errors.push(`Failed on original journal ${data.originalJournalId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      period: currentPeriod,
      processedCount: processedIds.length,
      errorsCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
