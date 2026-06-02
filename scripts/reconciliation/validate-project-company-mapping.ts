import fs from "node:fs";
import { mappingPathFromEnv, prisma, readCsv } from "./reconciliation-utils";

const mappingPath = mappingPathFromEnv("PROJECT_COMPANY_MAPPING_PATH", "project-company-mapping.draft.csv");
const validDecisions = new Set(["APPROVED_FOR_BACKFILL", "KEEP_UNASSIGNED", "ARCHIVED_LEGACY", "MANUAL_REVIEW"]);
const validActions = new Set(["BACKFILL_COMPANY", "NO_ACTION", "REVIEW_LATER"]);

async function main() {
  if (!fs.existsSync(mappingPath)) {
    console.log(JSON.stringify({ status: "FAIL", issues: [`Không tìm thấy file mapping: ${mappingPath}`] }, null, 2));
    process.exit(1);
  }

  const rows = readCsv(mappingPath);
  const issues: string[] = [];
  const warnings: string[] = [];
  let approved = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    if (!validDecisions.has(row.ownerDecision)) issues.push(`Dòng ${line}: ownerDecision không hợp lệ.`);
    if (!validActions.has(row.action)) issues.push(`Dòng ${line}: action không hợp lệ.`);

    const project = await prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true, companyId: true } });
    if (!project) {
      issues.push(`Dòng ${line}: projectId không tồn tại: ${row.projectId}.`);
      continue;
    }

    if (row.ownerDecision === "APPROVED_FOR_BACKFILL" || row.action === "BACKFILL_COMPANY") {
      if (row.ownerDecision !== "APPROVED_FOR_BACKFILL" || row.action !== "BACKFILL_COMPANY") {
        issues.push(`Dòng ${line}: BACKFILL_COMPANY phải đi cùng APPROVED_FOR_BACKFILL.`);
      }
      if (!row.approvedCompanyId) issues.push(`Dòng ${line}: thiếu approvedCompanyId.`);
      if (!row.approvedBy) issues.push(`Dòng ${line}: thiếu approvedBy.`);
      if (!row.decisionReason) issues.push(`Dòng ${line}: thiếu decisionReason.`);
      if (project.companyId && project.companyId !== row.approvedCompanyId && !row.decisionReason) {
        issues.push(`Dòng ${line}: project đã có company khác, bắt buộc có reason.`);
      }
      if (row.approvedCompanyId) {
        const company = await prisma.company.findUnique({ where: { id: row.approvedCompanyId }, select: { id: true } });
        if (!company) issues.push(`Dòng ${line}: approvedCompanyId không tồn tại: ${row.approvedCompanyId}.`);
      }
      approved += 1;
    } else {
      warnings.push(`Dòng ${line}: chưa approved, không được apply.`);
    }
  }

  console.log(JSON.stringify({
    status: issues.length ? "FAIL" : approved ? "PASS" : "WARNING",
    counts: { rows: rows.length, approvedForBackfill: approved, warnings: warnings.length, issues: issues.length },
    issues,
    warnings: warnings.slice(0, 20),
  }, null, 2));
  if (issues.length) process.exit(1);
}

main().catch(error => {
  console.error("FAIL validate-project-company-mapping");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
