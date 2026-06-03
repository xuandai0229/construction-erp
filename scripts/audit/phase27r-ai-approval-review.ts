import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { readCsv } from "../reconciliation/reconciliation-utils";

const reconciliationDir = path.join(process.cwd(), "docs", "reconciliation");
const auditDir = path.join(process.cwd(), "docs", "audit");

function countBy<T extends Record<string, string>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = row[key] || "(blank)";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

async function projectEvidence(row: Record<string, string>) {
  const project = await prisma.project.findUnique({
    where: { id: row.projectId },
    select: { id: true, name: true, companyId: true, company: { select: { name: true, code: true } } },
  });
  const [costs, invoices, payments, journals] = await Promise.all([
    prisma.costRecord.count({ where: { projectId: row.projectId, deletedAt: null } }),
    prisma.invoice.count({ where: { projectId: row.projectId, deletedAt: null } }),
    prisma.payment.count({ where: { projectId: row.projectId, deletedAt: null } }),
    prisma.journalEntry.count({ where: { projectId: row.projectId, deletedAt: null } }),
  ]);
  const testLike = /TEST|HARDENING|PHASE/i.test(row.projectName || "");
  let classification = "KEEP_MANUAL_REVIEW";
  if (testLike && costs + invoices + payments + journals === 0) classification = "SAFE_TEST_BACKFILL";
  else if (row.ownerDecision === "APPROVED_FOR_BACKFILL" && row.approvedBy === "Kế toán Trưởng") classification = "NEEDS_HUMAN_CONFIRMATION";
  if (row.projectId === "project-battrang" && project?.companyId) classification = "SUSPICIOUS_BACKFILL";
  return {
    projectId: row.projectId,
    projectName: row.projectName,
    ownerDecision: row.ownerDecision,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    approvedCompanyId: row.approvedCompanyId,
    currentCompanyId: project?.companyId || null,
    currentCompanyName: project?.company?.name || null,
    counts: { costs, invoices, payments, journals },
    evidence: row.evidence,
    decisionReason: row.decisionReason,
    classification,
    recommendation: classification === "SAFE_TEST_BACKFILL"
      ? "Có thể giữ nếu owner xác nhận đây là dữ liệu test/hardening."
      : "Cần owner/kế toán thật xác nhận; không coi approval generic là hợp lệ.",
  };
}

async function journalEvidence(row: Record<string, string>) {
  const journal = await prisma.journalEntry.findUnique({
    where: { id: row.journalEntryId },
    include: { lines: { include: { account: true } } },
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "JournalEntry", entityId: row.journalEntryId },
    orderBy: { timestamp: "desc" },
    take: 10,
  });
  const description = row.description || journal?.description || "";
  const possiblyProject = /WBS|công trình|dự án|khách hàng|tạm ứng|thanh toán/i.test(description);
  const reversed = journal?.isReversed || /reversed/i.test(row.evidence || "");
  let classification = "MANUAL_REVIEW_REQUIRED";
  if (reversed) classification = "REVERSED_TRACE_ONLY";
  else if (possiblyProject) classification = "POSSIBLY_PROJECT_RELATED";
  else if (row.ownerDecision === "NON_PROJECT_FINANCE") classification = "LIKELY_NON_PROJECT_BUT_NEEDS_CONFIRMATION";
  return {
    journalEntryId: row.journalEntryId,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    amountDebit: Number(row.amountDebit || 0),
    amountCredit: Number(row.amountCredit || 0),
    description,
    ownerDecision: row.ownerDecision,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    nonProjectReason: row.nonProjectReason,
    isReversed: Boolean(journal?.isReversed),
    accounts: journal?.lines.map(line => `${line.type}:${line.account.code}:${Number(line.amount)}`) || [],
    auditLogCount: auditLogs.length,
    auditActions: auditLogs.map(log => ({ action: log.action, reason: log.reason, userId: log.userId, timestamp: log.timestamp })),
    classification,
    recommendation: classification === "POSSIBLY_PROJECT_RELATED"
      ? "Không đủ bằng chứng để đánh dấu non-project; cần kế toán xác nhận chứng từ gốc."
      : "Không coi approval generic là xác nhận người thật.",
  };
}

async function main() {
  const projectRows = readCsv(path.join(reconciliationDir, "project-company-mapping.draft.csv"));
  const journalRows = readCsv(path.join(reconciliationDir, "journal-project-mapping.draft.csv"));
  const apRows = readCsv(path.join(reconciliationDir, "project-battrang-ap-reconciliation.draft.csv"));

  const [projectDetails, journalDetails, battrang] = await Promise.all([
    Promise.all(projectRows.map(projectEvidence)),
    Promise.all(journalRows.map(journalEvidence)),
    prisma.project.findUnique({ where: { id: "project-battrang" }, select: { id: true, name: true, companyId: true } }),
  ]);

  const result = {
    generatedAt: new Date().toISOString(),
    mappingStats: {
      projectCompany: {
        rows: projectRows.length,
        ownerDecision: countBy(projectRows, "ownerDecision"),
        approvedBy: countBy(projectRows, "approvedBy"),
      },
      journalProject: {
        rows: journalRows.length,
        ownerDecision: countBy(journalRows, "ownerDecision"),
        approvedBy: countBy(journalRows, "approvedBy"),
      },
      battrangAp: {
        rows: apRows.length,
        ownerDecision: countBy(apRows, "ownerDecision"),
        mappingAction: countBy(apRows, "mappingAction"),
        approvedBy: countBy(apRows, "approvedBy"),
      },
    },
    projectBattrang: battrang,
    projectDetails,
    journalDetails,
    apRows: apRows.map(row => ({
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      journalEntryId: row.journalEntryId,
      signedAmount: Number(row.signedAmount || 0),
      isReversed: row.isReversed,
      ownerDecision: row.ownerDecision,
      mappingAction: row.mappingAction,
      approvedBy: row.approvedBy,
      decisionReason: row.decisionReason,
    })),
  };

  fs.mkdirSync(auditDir, { recursive: true });
  fs.writeFileSync(path.join(auditDir, "phase27r-forensic-data.json"), JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify({
    status: "PASS",
    projectRows: projectRows.length,
    journalRows: journalRows.length,
    apRows: apRows.length,
    battrangCompanyId: battrang?.companyId || null,
  }, null, 2));
}

main().catch(error => {
  console.error("FAIL phase27r-ai-approval-review");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
