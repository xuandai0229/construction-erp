import fs from "node:fs";
import path from "node:path";
import { prisma, readCsv } from "./reconciliation-utils";

const mappingPath = path.resolve(
  process.cwd(),
  ".local-audit-quarantine/human-approval-package/test-only/project-company-mapping.test-approval.csv",
);
const rollbackPath = path.resolve(
  process.cwd(),
  ".local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv",
);

async function main() {
  if (!fs.existsSync(mappingPath)) throw new Error(`Missing mapping file: ${mappingPath}`);
  if (!fs.existsSync(rollbackPath)) throw new Error(`Missing rollback file: ${rollbackPath}`);

  const mappingRows = readCsv(mappingPath);
  const rollbackRows = readCsv(rollbackPath);
  const approvedRows = mappingRows.filter(row => row.ownerDecision === "APPROVED_FOR_BACKFILL" && row.action === "BACKFILL_COMPANY");
  const manualRows = mappingRows.filter(row => row.ownerDecision !== "APPROVED_FOR_BACKFILL" || row.action !== "BACKFILL_COMPANY");
  const issues: string[] = [];

  if (approvedRows.length !== 18) issues.push(`Expected 18 approved rows, got ${approvedRows.length}.`);
  if (rollbackRows.length !== 18) issues.push(`Expected 18 rollback rows, got ${rollbackRows.length}.`);

  for (const row of rollbackRows) {
    const project = await prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true, companyId: true } });
    if (!project) {
      issues.push(`Project missing after apply: ${row.projectId}.`);
      continue;
    }
    if ((project.companyId || "") !== row.afterCompanyId) {
      issues.push(`Project ${row.projectId} companyId mismatch: expected ${row.afterCompanyId}, got ${project.companyId || ""}.`);
    }
  }

  const manualProjectIds = manualRows.map(row => row.projectId).filter(Boolean);
  const manualAuditCount = manualProjectIds.length
    ? await prisma.auditLog.count({
        where: {
          action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
          entity: "Project",
          entityId: { in: manualProjectIds },
        },
      })
    : 0;
  if (manualAuditCount) issues.push(`Manual review project received TEST_ONLY audit log count=${manualAuditCount}.`);

  const journalAuditCount = await prisma.auditLog.count({
    where: {
      action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
      entity: "JournalEntry",
    },
  });
  if (journalAuditCount) issues.push(`Unexpected JournalEntry test reconciliation audit count=${journalAuditCount}.`);

  const result = {
    status: issues.length ? "FAIL" : "PASS",
    counts: {
      approvedRows: approvedRows.length,
      rollbackRows: rollbackRows.length,
      manualRows: manualRows.length,
      journalEntryUpdatesDetected: journalAuditCount,
      issues: issues.length,
    },
    issues,
  };
  console.log(JSON.stringify(result, null, 2));
  if (issues.length) process.exit(1);
}

main()
  .catch(error => {
    console.error("FAIL validate-phase2_7T-test-apply");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
