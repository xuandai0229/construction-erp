import fs from "node:fs";
import path from "node:path";
import { csvEscape, mappingPathFromEnv, prisma, readCsv } from "./reconciliation-utils";

const REQUIRED_MARKERS = [
  "TEST_ONLY_AI_APPROVAL",
  "SANDBOX_VALIDATION_ONLY",
  "NOT_FOR_PRODUCTION",
  "NOT_HUMAN_APPROVAL",
  "NOT_ACCOUNTING_SIGN_OFF",
];

const EXPECTED_APPLY_COUNT = 18;
const mappingPath = mappingPathFromEnv("PROJECT_COMPANY_MAPPING_PATH", "project-company-mapping.test-approval.csv");
const rollbackPath = path.resolve(
  process.cwd(),
  ".local-audit-quarantine/test-approval-backup/phase2_7T_project_company_rollback.csv",
);

function requireEnvFlag(name: string) {
  if (process.env[name] !== "true") {
    throw new Error(`${name}=true is required for test-only apply.`);
  }
}

function assertSandboxDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const url = new URL(databaseUrl);
  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
  if (!allowedHosts.has(url.hostname)) {
    throw new Error(`BLOCKED_PRODUCTION_RISK: database host is not local (${url.hostname}).`);
  }
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName || /prod|production/i.test(dbName)) {
    throw new Error(`BLOCKED_PRODUCTION_RISK: database name is not allowed for test apply (${dbName}).`);
  }
}

function assertTestOnlyPath(filePath: string) {
  const normalized = path.resolve(process.cwd(), filePath).replace(/\\/g, "/");
  const required = ".local-audit-quarantine/human-approval-package/test-only/";
  if (!normalized.includes(required)) {
    throw new Error(`PROJECT_COMPANY_MAPPING_PATH must point to ${required}.`);
  }
}

function assertMarkers(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const missing = REQUIRED_MARKERS.filter(marker => !content.includes(marker));
  if (missing.length) {
    throw new Error(`Test-only mapping file is missing markers: ${missing.join(", ")}`);
  }
}

function writeRollbackCsv(rows: Array<Record<string, unknown>>) {
  fs.mkdirSync(path.dirname(rollbackPath), { recursive: true });
  const headers = ["projectId", "projectCode", "projectName", "beforeCompanyId", "afterCompanyId", "testApprovalReason"];
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(rollbackPath, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

async function main() {
  requireEnvFlag("ALLOW_TEST_ONLY_AI_APPROVAL");
  requireEnvFlag("REQUIRE_SANDBOX_DATABASE");
  assertSandboxDatabase();
  assertTestOnlyPath(mappingPath);
  assertMarkers(mappingPath);

  const rows = readCsv(mappingPath);
  const approvedRows = rows.filter(row =>
    row.ownerDecision === "APPROVED_FOR_BACKFILL" &&
    row.action === "BACKFILL_COMPANY" &&
    row.approvedBy === "AI_TEST_APPROVER_SANDBOX" &&
    row.approvedRole === "Test Automation" &&
    Boolean(row.approvedCompanyId) &&
    row.decisionReason?.includes("TEST_ONLY_AI_APPROVAL"),
  );

  if (approvedRows.length !== EXPECTED_APPLY_COUNT) {
    throw new Error(`BLOCKED_BY_UNEXPECTED_APPLY_COUNT: expected ${EXPECTED_APPLY_COUNT}, got ${approvedRows.length}.`);
  }

  const rollbackRows: Array<Record<string, unknown>> = [];
  for (const row of approvedRows) {
    const [project, company] = await Promise.all([
      prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true, name: true, companyId: true } }),
      prisma.company.findUnique({ where: { id: row.approvedCompanyId }, select: { id: true } }),
    ]);
    if (!project) throw new Error(`Project does not exist: ${row.projectId}`);
    if (!company) throw new Error(`approvedCompanyId does not exist: ${row.approvedCompanyId}`);
    rollbackRows.push({
      projectId: project.id,
      projectCode: row.projectCode || "",
      projectName: row.projectName || project.name || "",
      beforeCompanyId: project.companyId || "",
      afterCompanyId: row.approvedCompanyId,
      testApprovalReason: row.decisionReason,
    });
  }
  writeRollbackCsv(rollbackRows);

  const updates: Array<Record<string, unknown>> = [];
  await prisma.$transaction(async tx => {
    for (const row of approvedRows) {
      const before = await tx.project.findUnique({
        where: { id: row.projectId },
        select: { id: true, name: true, companyId: true },
      });
      if (!before) throw new Error(`Project disappeared during transaction: ${row.projectId}`);
      const after = await tx.project.update({
        where: { id: row.projectId },
        data: { companyId: row.approvedCompanyId },
        select: { id: true, name: true, companyId: true },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          action: "TEST_ONLY_DATA_RECONCILIATION_BACKFILL",
          entity: "Project",
          entityId: row.projectId,
          oldData: before,
          newData: {
            ...after,
            notForProduction: true,
            sandboxValidationOnly: true,
            notHumanApproval: true,
            notAccountingSignOff: true,
          },
          reason: `TEST_ONLY_AI_APPROVAL_SANDBOX: ${row.decisionReason}`,
          severity: "WARNING",
        },
        select: { id: true },
      });
      updates.push({
        projectId: row.projectId,
        beforeCompanyId: before.companyId || "",
        afterCompanyId: after.companyId || "",
        result: "UPDATED_TEST_ONLY",
        auditLogId: auditLog.id,
      });
    }
  });

  console.log(JSON.stringify({
    status: "PASS",
    testOnly: true,
    updated: updates.length,
    rollbackPath,
    updates,
  }, null, 2));
}

main()
  .catch(error => {
    console.error("FAIL apply-project-company-mapping-test-only");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
