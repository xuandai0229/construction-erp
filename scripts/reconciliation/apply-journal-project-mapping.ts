import path from "node:path";
import { prisma, readCsv, reconciliationDir, writeAuditJson } from "./reconciliation-utils";

const mappingPath = path.join(reconciliationDir, "journal-project-mapping.draft.csv");

async function main() {
  const rows = readCsv(mappingPath);
  const approvedRows = rows.filter(row => row.ownerDecision === "APPROVED_FOR_BACKFILL" && row.action === "BACKFILL_PROJECT");
  const nonProjectRows = rows.filter(row => row.ownerDecision === "NON_PROJECT_FINANCE" && row.action === "MARK_NON_PROJECT");
  const updates: Array<Record<string, unknown>> = [];

  await prisma.$transaction(async tx => {
    for (const row of approvedRows) {
      const before = await tx.journalEntry.findUnique({ where: { id: row.journalEntryId }, select: { id: true, projectId: true, sourceType: true, sourceId: true, date: true } });
      if (!before) continue;
      const after = await tx.journalEntry.update({
        where: { id: row.journalEntryId },
        data: { projectId: row.approvedProjectId },
        select: { id: true, projectId: true, sourceType: true, sourceId: true, date: true },
      });
      await tx.auditLog.create({
        data: {
          action: "DATA_RECONCILIATION_BACKFILL",
          entity: "JournalEntry",
          entityId: row.journalEntryId,
          oldData: before,
          newData: after,
          reason: `Phase 2.6 journal-project mapping approved by ${row.approvedBy}: ${row.decisionReason}`,
          severity: "WARNING",
        },
      });
      updates.push({ row, before, after });
    }
    for (const row of nonProjectRows) {
      await tx.auditLog.create({
        data: {
          action: "DATA_RECONCILIATION_NON_PROJECT",
          entity: "JournalEntry",
          entityId: row.journalEntryId,
          reason: `Phase 2.6 non-project finance approved by ${row.approvedBy || "UNSPECIFIED"}: ${row.nonProjectReason}`,
          severity: "INFO",
          newData: row,
        },
      });
    }
  });

  const result = {
    generatedAt: new Date().toISOString(),
    updated: updates.length,
    markedNonProject: nonProjectRows.length,
    skipped: rows.length - approvedRows.length - nonProjectRows.length,
    updates,
    nonProjectRows,
    rollbackNote: "Rollback thủ công bằng updates[].before.projectId; dòng NON_PROJECT_FINANCE không update projectId, chỉ ghi AuditLog.",
    backupNote: "Mapping explicit nằm tại docs/reconciliation/journal-project-mapping.draft.csv.",
  };
  writeAuditJson("phase26-journal-project-apply-result.json", result);
  console.log(JSON.stringify({ status: "PASS", updated: updates.length, markedNonProject: nonProjectRows.length, skipped: result.skipped }, null, 2));
}

main().catch(error => {
  console.error("FAIL apply-journal-project-mapping");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
