import fs from "node:fs";
import path from "node:path";
import { prisma, readCsv, reconciliationDir } from "./reconciliation-utils";

const mappingPath = path.join(reconciliationDir, "journal-project-mapping.draft.csv");
const validDecisions = new Set(["APPROVED_FOR_BACKFILL", "NON_PROJECT_FINANCE", "MANUAL_REVIEW", "EXCLUDE_FROM_PROJECT_REPORTING"]);
const validActions = new Set(["BACKFILL_PROJECT", "MARK_NON_PROJECT", "NO_ACTION", "REVIEW_LATER"]);
const projectSourceTypes = new Set(["COST", "INVOICE", "PAYMENT", "ADVANCE", "ADVANCE_SETTLEMENT", "CONTRACT"]);

async function sourceHasProject(sourceType: string, sourceId: string) {
  const type = sourceType.toUpperCase();
  if (type === "COST") return prisma.costRecord.findUnique({ where: { id: sourceId }, select: { projectId: true } });
  if (type === "INVOICE") return prisma.invoice.findUnique({ where: { id: sourceId }, select: { projectId: true } });
  if (type === "PAYMENT") return prisma.payment.findUnique({ where: { id: sourceId }, select: { projectId: true } });
  if (type === "ADVANCE") return prisma.advanceRequest.findUnique({ where: { id: sourceId }, select: { projectId: true } });
  if (type === "CONTRACT") return prisma.contract.findUnique({ where: { id: sourceId }, select: { projectId: true } });
  return null;
}

async function main() {
  if (!fs.existsSync(mappingPath)) {
    console.log(JSON.stringify({ status: "FAIL", issues: [`Không tìm thấy file mapping: ${mappingPath}`] }, null, 2));
    process.exit(1);
  }

  const rows = readCsv(mappingPath);
  const issues: string[] = [];
  const warnings: string[] = [];
  let approved = 0;
  let nonProject = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    if (!validDecisions.has(row.ownerDecision)) issues.push(`Dòng ${line}: ownerDecision không hợp lệ.`);
    if (!validActions.has(row.action)) issues.push(`Dòng ${line}: action không hợp lệ.`);

    const journal = await prisma.journalEntry.findUnique({ where: { id: row.journalEntryId }, select: { id: true, projectId: true, isReversed: true, sourceType: true, sourceId: true } });
    if (!journal) {
      issues.push(`Dòng ${line}: journalEntryId không tồn tại: ${row.journalEntryId}.`);
      continue;
    }

    if (row.ownerDecision === "APPROVED_FOR_BACKFILL" || row.action === "BACKFILL_PROJECT") {
      if (row.ownerDecision !== "APPROVED_FOR_BACKFILL" || row.action !== "BACKFILL_PROJECT") {
        issues.push(`Dòng ${line}: BACKFILL_PROJECT phải đi cùng APPROVED_FOR_BACKFILL.`);
      }
      if (!row.approvedProjectId) issues.push(`Dòng ${line}: thiếu approvedProjectId.`);
      if (!row.approvedBy) issues.push(`Dòng ${line}: thiếu approvedBy.`);
      if (!row.decisionReason) issues.push(`Dòng ${line}: thiếu decisionReason.`);
      if (journal.isReversed && !row.decisionReason) issues.push(`Dòng ${line}: journal reversed cần decisionReason rõ.`);
      if (row.approvedProjectId) {
        const project = await prisma.project.findUnique({ where: { id: row.approvedProjectId }, select: { id: true } });
        if (!project) issues.push(`Dòng ${line}: approvedProjectId không tồn tại: ${row.approvedProjectId}.`);
      }
      approved += 1;
    } else if (row.ownerDecision === "NON_PROJECT_FINANCE" || row.action === "MARK_NON_PROJECT") {
      if (row.ownerDecision !== "NON_PROJECT_FINANCE" || row.action !== "MARK_NON_PROJECT") {
        issues.push(`Dòng ${line}: MARK_NON_PROJECT phải đi cùng NON_PROJECT_FINANCE.`);
      }
      if (!row.nonProjectReason) issues.push(`Dòng ${line}: thiếu nonProjectReason.`);
      if (journal.sourceType && journal.sourceId && projectSourceTypes.has(journal.sourceType.toUpperCase())) {
        const source = await sourceHasProject(journal.sourceType, journal.sourceId);
        if (source?.projectId) issues.push(`Dòng ${line}: source tài chính công trình có project rõ, không được đánh dấu non-project.`);
      }
      nonProject += 1;
    } else {
      warnings.push(`Dòng ${line}: chưa có quyết định owner, không apply.`);
    }
  }

  console.log(JSON.stringify({
    status: issues.length ? "FAIL" : approved || nonProject ? "PASS" : "WARNING",
    counts: { rows: rows.length, approvedForBackfill: approved, nonProjectFinance: nonProject, warnings: warnings.length, issues: issues.length },
    issues,
    warnings: warnings.slice(0, 20),
  }, null, 2));
  if (issues.length) process.exit(1);
}

main().catch(error => {
  console.error("FAIL validate-journal-project-mapping");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
