import fs from "node:fs";
import path from "node:path";
import { readCsv, reconciliationDir } from "./reconciliation-utils";

const mappingPath = path.join(reconciliationDir, "project-battrang-ap-reconciliation.draft.csv");
const validDecisions = new Set([
  "LEDGER_CORRECT_OPERATIONAL_MISSING",
  "OPERATIONAL_CORRECT_LEDGER_NEEDS_REVIEW",
  "REVERSAL_POLICY_ISSUE",
  "DUPLICATE_OR_WRONG_JOURNAL",
  "MANUAL_REVIEW",
]);
const validActions = new Set([
  "FIX_OPERATIONAL_MAPPING",
  "FIX_RECONCILIATION_QUERY",
  "REVIEW_LEDGER",
  "CREATE_ADJUSTMENT_PROPOSAL",
  "NO_ACTION",
]);

async function main() {
  if (!fs.existsSync(mappingPath)) {
    console.log(JSON.stringify({ status: "FAIL", issues: [`Không tìm thấy file AP reconciliation: ${mappingPath}`] }, null, 2));
    process.exit(1);
  }

  const rows = readCsv(mappingPath);
  const issues: string[] = [];
  const warnings: string[] = [];
  let decisions = 0;

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    if (!validDecisions.has(row.ownerDecision)) issues.push(`Dòng ${line}: ownerDecision không hợp lệ.`);
    if (!validActions.has(row.mappingAction)) issues.push(`Dòng ${line}: mappingAction không hợp lệ.`);

    if (row.ownerDecision !== "MANUAL_REVIEW" || row.mappingAction !== "NO_ACTION") {
      decisions += 1;
      if (!row.decisionReason) issues.push(`Dòng ${line}: quyết định AP phải có decisionReason.`);
    } else {
      warnings.push(`Dòng ${line}: AP line còn MANUAL_REVIEW.`);
    }

    if (row.mappingAction === "CREATE_ADJUSTMENT_PROPOSAL") {
      if (!row.decisionReason) issues.push(`Dòng ${line}: adjustment proposal thiếu reason.`);
      if (!row.approvedBy || !row.approvedAt) issues.push(`Dòng ${line}: adjustment proposal cần approvedBy và approvedAt.`);
    }
    if (row.mappingAction === "FIX_OPERATIONAL_MAPPING" && !row.operationalRecordExists) {
      issues.push(`Dòng ${line}: FIX_OPERATIONAL_MAPPING phải chỉ rõ operational source tồn tại.`);
    }
    if (row.mappingAction === "FIX_RECONCILIATION_QUERY" && !/query|service|file|reconciliation|financial/i.test(row.decisionReason || "")) {
      issues.push(`Dòng ${line}: FIX_RECONCILIATION_QUERY phải nêu query/file/service cần sửa trong decisionReason.`);
    }
  }

  console.log(JSON.stringify({
    status: issues.length ? "FAIL" : decisions ? "PASS" : "WARNING",
    counts: { rows: rows.length, decidedRows: decisions, manualReview: warnings.length, issues: issues.length },
    issues,
    warnings: warnings.slice(0, 20),
  }, null, 2));
  if (issues.length) process.exit(1);
}

main().catch(error => {
  console.error("FAIL validate-project-battrang-ap-decision");
  console.error(error);
  process.exit(1);
});
