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
const rollbackInstructionPath = path.resolve(
  process.cwd(),
  ".local-audit-quarantine/test-approval-backup/PHASE2_7T_ROLLBACK_INSTRUCTIONS.md",
);
const applyReportPath = path.resolve(process.cwd(), "PHASE2_7T_TEST_ONLY_APPLY_RESULT_REPORT.md");

function hasRequiredValue(row: Record<string, string>, key: string) {
  return typeof row[key] === "string" && row[key].trim().length > 0;
}

function hasTestOnlyFlags(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return (
    data.notForProduction === true &&
    data.sandboxValidationOnly === true &&
    data.notHumanApproval === true &&
    data.notAccountingSignOff === true
  );
}

async function main() {
  const issues: string[] = [];
  const fileStatus = {
    applyReportExists: fs.existsSync(applyReportPath),
    rollbackCsvExists: fs.existsSync(rollbackPath),
    rollbackInstructionExists: fs.existsSync(rollbackInstructionPath),
    mappingFileExists: fs.existsSync(mappingPath),
  };

  for (const [name, exists] of Object.entries(fileStatus)) {
    if (!exists) issues.push(`Missing required file: ${name}`);
  }
  if (issues.length) {
    console.log(JSON.stringify({ status: "FAIL", fileStatus, issues }, null, 2));
    process.exit(1);
  }

  const mappingRows = readCsv(mappingPath);
  const rollbackRows = readCsv(rollbackPath);
  const approvedRows = mappingRows.filter(row =>
    row.ownerDecision === "APPROVED_FOR_BACKFILL" &&
    row.action === "BACKFILL_COMPANY" &&
    row.approvedBy === "AI_TEST_APPROVER_SANDBOX" &&
    row.approvedRole === "Test Automation" &&
    hasRequiredValue(row, "approvedCompanyId") &&
    row.decisionReason?.includes("TEST_ONLY_AI_APPROVAL"),
  );
  const manualRows = mappingRows.filter(row => row.ownerDecision !== "APPROVED_FOR_BACKFILL" || row.action !== "BACKFILL_COMPANY");

  if (approvedRows.length !== 18) issues.push(`Expected 18 approved rows, got ${approvedRows.length}.`);
  if (manualRows.length !== 1) issues.push(`Expected 1 manual review row, got ${manualRows.length}.`);
  if (rollbackRows.length !== 18) issues.push(`Expected 18 rollback rows, got ${rollbackRows.length}.`);

  for (const row of rollbackRows) {
    for (const key of ["projectId", "projectName", "afterCompanyId", "testApprovalReason"]) {
      if (!hasRequiredValue(row, key)) issues.push(`Rollback row ${row.projectId || "(missing projectId)"} missing ${key}.`);
    }
    if (!Object.prototype.hasOwnProperty.call(row, "beforeCompanyId")) {
      issues.push(`Rollback row ${row.projectId || "(missing projectId)"} missing beforeCompanyId column.`);
    }
  }

  const projectVerification = [];
  for (const row of approvedRows) {
    const project = await prisma.project.findUnique({
      where: { id: row.projectId },
      select: { id: true, name: true, companyId: true },
    });
    const ok = Boolean(project) && (project?.companyId || "") === row.approvedCompanyId;
    if (!ok) {
      issues.push(`Project ${row.projectId} companyId mismatch: expected ${row.approvedCompanyId}, got ${project?.companyId || "(missing)"}.`);
    }
    projectVerification.push({
      projectId: row.projectId,
      projectCode: row.projectCode || "",
      projectName: row.projectName || project?.name || "",
      currentCompanyId: project?.companyId || "",
      expectedCompanyId: row.approvedCompanyId,
      result: ok ? "PASS" : "FAIL",
    });
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
  if (manualAuditCount > 0) issues.push(`Manual review project has ${manualAuditCount} TEST_ONLY Project audit log(s).`);

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
      entity: "Project",
      entityId: { in: approvedRows.map(row => row.projectId) },
      reason: { contains: "TEST_ONLY_AI_APPROVAL_SANDBOX" },
    },
    select: { id: true, entityId: true, reason: true, newData: true },
  });

  const auditLogsWithFlags = auditLogs.filter(log => hasTestOnlyFlags(log.newData));
  const auditedEntityIds = new Set(auditLogs.map(log => log.entityId));
  const missingAuditProjects = approvedRows.filter(row => !auditedEntityIds.has(row.projectId)).map(row => row.projectId);
  if (auditLogs.length !== 18) issues.push(`Expected 18 Project test-only audit logs, got ${auditLogs.length}.`);
  if (auditLogsWithFlags.length !== auditLogs.length) {
    issues.push(`Expected all test-only audit logs to contain notForProduction/sandbox flags, got ${auditLogsWithFlags.length}/${auditLogs.length}.`);
  }
  if (missingAuditProjects.length) issues.push(`Projects missing test-only audit logs: ${missingAuditProjects.join(", ")}.`);

  const forbiddenAuditCounts = {
    cashBankJournal: await prisma.auditLog.count({
      where: {
        action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
        entity: "JournalEntry",
      },
    }),
    transactionLine: await prisma.auditLog.count({
      where: {
        action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
        entity: "TransactionLine",
      },
    }),
    nonProjectFinance: await prisma.auditLog.count({
      where: {
        action: { contains: "NON_PROJECT" },
        timestamp: { gte: new Date("2026-06-04T00:00:00.000Z") },
      },
    }),
    adjustmentJournal: await prisma.journalEntry.count({
      where: {
        OR: [
          { sourceType: { contains: "ADJUSTMENT" } },
          { description: { contains: "TEST_ONLY_AI_APPROVAL" } },
          { description: { contains: "Bát Tràng" } },
        ],
      },
    }),
  };
  if (forbiddenAuditCounts.cashBankJournal) issues.push(`Unexpected JournalEntry TEST_ONLY audit logs: ${forbiddenAuditCounts.cashBankJournal}.`);
  if (forbiddenAuditCounts.transactionLine) issues.push(`Unexpected TransactionLine TEST_ONLY audit logs: ${forbiddenAuditCounts.transactionLine}.`);

  const result = {
    status: issues.length ? "FAIL" : "PASS",
    fileStatus,
    counts: {
      mappingRows: mappingRows.length,
      approvedRows: approvedRows.length,
      manualRows: manualRows.length,
      rollbackRows: rollbackRows.length,
      projectVerificationPass: projectVerification.filter(row => row.result === "PASS").length,
      auditLogs: auditLogs.length,
      auditLogsWithFlags: auditLogsWithFlags.length,
      manualProjectTestOnlyAuditLogs: manualAuditCount,
      forbiddenAuditCounts,
      issues: issues.length,
    },
    projectVerification,
    issues,
  };

  console.log(JSON.stringify(result, null, 2));
  if (issues.length) process.exit(1);
}

main()
  .catch(error => {
    console.error("FAIL verify-phase2_7T-post-apply");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
