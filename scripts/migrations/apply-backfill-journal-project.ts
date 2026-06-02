import { buildJournalProjectPlan, prisma, writeAuditJson } from "./phase25-backfill-utils";

async function main() {
  const plan = await buildJournalProjectPlan();
  const candidates = plan.filter(item => item.confidence === "HIGH" && item.inferredProjectId);
  const updates: Array<Record<string, unknown>> = [];

  await prisma.$transaction(async tx => {
    for (const item of candidates) {
      const before = await tx.journalEntry.findUnique({
        where: { id: item.journalEntryId },
        select: { id: true, projectId: true, sourceType: true, sourceId: true, date: true },
      });
      if (!before || before.projectId) continue;
      const after = await tx.journalEntry.update({
        where: { id: item.journalEntryId },
        data: { projectId: item.inferredProjectId },
        select: { id: true, projectId: true, sourceType: true, sourceId: true, date: true },
      });
      await tx.auditLog.create({
        data: {
          action: "DATA_BACKFILL",
          entity: "JournalEntry",
          entityId: item.journalEntryId,
          oldData: before,
          newData: after,
          reason: `Phase 2.5 backfill projectId: ${item.reason}`,
          severity: "WARNING",
        },
      });
      updates.push({ plan: item, before, after });
    }
  });

  const result = {
    mode: "apply",
    generatedAt: new Date().toISOString(),
    updated: updates.length,
    skipped: plan.length - updates.length,
    updates,
    manualReview: plan.filter(item => item.confidence !== "HIGH"),
    rollbackNote: "Rollback thủ công: dùng updates[].before.projectId trong file này để set lại JournalEntry.projectId; mọi thay đổi đã có AuditLog action DATA_BACKFILL.",
  };
  writeAuditJson("phase25-journal-project-backfill.json", result);
  console.log(JSON.stringify({ updated: result.updated, skipped: result.skipped, manualReview: result.manualReview.length }, null, 2));
}

main().catch(error => {
  console.error("FAIL apply-backfill-journal-project");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
