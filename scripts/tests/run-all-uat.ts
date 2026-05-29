import { execSync } from "child_process";

const testFiles = [
  "scripts/tests/accounting-workflow-guards.ts",
  "scripts/tests/advance-settlement-db-fixture.ts",
  "scripts/tests/advance-settlement-offset-guards.ts",
  "scripts/tests/approval-inbox-guards.ts",
  "scripts/tests/ar-ap-aging-guards.ts",
  "scripts/tests/contract-invoice-guards.ts",
  "scripts/tests/document-lifecycle-guards.ts",
  "scripts/tests/drilldown-ui-guards.ts",
  "scripts/tests/export-print-guards.ts",
  "scripts/tests/financial-trace-guards.ts",
  "scripts/tests/invoice-payment-allocation-guards.ts",
  "scripts/tests/management-report-guards.ts",
  "scripts/tests/outstanding-advance-report-guards.ts",
  "scripts/tests/production-readiness-guards.ts",
  "scripts/tests/cash-bank-document-guards.ts"
];

console.log("==================================================================");
console.log(" RUNNING ALL UAT ACCORDING WORKFLOWS & GUARDS");
console.log("==================================================================");

let passedCount = 0;
let failedCount = 0;

for (const file of testFiles) {
  console.log(`\n▶ Running ${file}...`);
  try {
    const stdout = execSync(`npx tsx ${file}`, { encoding: "utf-8" });
    console.log(stdout);
    console.log(`✓ ${file} PASSED!`);
    passedCount++;
  } catch (error: any) {
    console.error(`✗ ${file} FAILED!`);
    console.error(error.stdout || error.message);
    failedCount++;
  }
}

console.log("\n==================================================================");
console.log(" UAT WORKFLOW EXECUTION SUMMARY");
console.log("==================================================================");
console.log(`Total tests run: ${testFiles.length}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);
console.log("==================================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
