import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const service = fs.readFileSync(path.join(root, "services/financial-aggregation.service.ts"), "utf8");
const monthlyMatch = service.match(/static async getProjectMonthlyReport[\s\S]*?\n  \/\*\*/);
const monthly = monthlyMatch?.[0] || "";
const failures: string[] = [];

if (!monthly.includes("prisma.transactionLine.findMany")) {
  failures.push("Monthly report chưa lấy số liệu từ ledger transaction lines.");
}

if (!monthly.includes("getPostedLedgerLineFilter({ projectId })")) {
  failures.push("Monthly report chưa filter posted/unreversed ledger.");
}

for (const forbidden of ["costRecord.findMany", "invoice.findMany", "payment.findMany"]) {
  if (monthly.includes(forbidden)) {
    failures.push(`Monthly report còn lấy trực tiếp từ bảng nghiệp vụ: ${forbidden}.`);
  }
}

if (failures.length) {
  console.error("FAIL verify-draft-not-in-financial-report");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS verify-draft-not-in-financial-report: báo cáo tháng chính thức dùng ledger posted, không cộng DRAFT/PENDING.");
