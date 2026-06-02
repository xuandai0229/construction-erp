import { mappingPathFromEnv, prisma, readCsv, writeAuditJson } from "./reconciliation-utils";

const mappingPath = mappingPathFromEnv("PROJECT_COMPANY_MAPPING_PATH", "project-company-mapping.draft.csv");

async function main() {
  const rows = readCsv(mappingPath);
  const approvedRows = rows.filter(row => row.ownerDecision === "APPROVED_FOR_BACKFILL" && row.action === "BACKFILL_COMPANY");
  const updates: Array<Record<string, unknown>> = [];
  const skipped = rows.length - approvedRows.length;

  await prisma.$transaction(async tx => {
    for (const row of approvedRows) {
      const before = await tx.project.findUnique({ where: { id: row.projectId }, select: { id: true, name: true, companyId: true } });
      if (!before) continue;
      const after = await tx.project.update({
        where: { id: row.projectId },
        data: { companyId: row.approvedCompanyId },
        select: { id: true, name: true, companyId: true },
      });
      await tx.auditLog.create({
        data: {
          action: "DATA_RECONCILIATION_BACKFILL",
          entity: "Project",
          entityId: row.projectId,
          oldData: before,
          newData: after,
          reason: `Phase 2.6 project-company mapping approved by ${row.approvedBy}: ${row.decisionReason}`,
          severity: "WARNING",
        },
      });
      updates.push({ row, before, after });
    }
  });

  const result = {
    generatedAt: new Date().toISOString(),
    updated: updates.length,
    skipped,
    updates,
    rollbackNote: "Rollback thủ công bằng updates[].before.companyId; mọi thay đổi đã ghi AuditLog DATA_RECONCILIATION_BACKFILL.",
    backupNote: `Mapping explicit nằm tại ${mappingPath}.`,
  };
  writeAuditJson("phase26-project-company-apply-result.json", result);
  console.log(JSON.stringify({ status: "PASS", updated: updates.length, skipped }, null, 2));
}

main().catch(error => {
  console.error("FAIL apply-project-company-mapping");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
