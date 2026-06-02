import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportsPage = fs.readFileSync(path.join(root, "app/reports/page.tsx"), "utf8");
const auditedRoute = fs.readFileSync(path.join(root, "app/api/reports/audited-export/route.ts"), "utf8");
const failures: string[] = [];

if (reportsPage.includes("exportToCsv")) {
  failures.push("Trang reports vẫn còn export CSV client-side.");
}

if (!reportsPage.includes("/api/reports/audited-export")) {
  failures.push("Trang reports chưa dùng endpoint audited-export.");
}

const postHandler = auditedRoute.match(/export async function POST[\s\S]*$/)?.[0] || "";
const auditIndex = postHandler.indexOf("auditExportOrThrow");
const buildRowsIndex = postHandler.indexOf("buildRows(reportType, projectId)");
if (auditIndex === -1 || buildRowsIndex === -1 || auditIndex > buildRowsIndex) {
  failures.push("Endpoint audited-export chưa ghi audit thành công trước khi generate file.");
}

if (!auditedRoute.includes("filters")) {
  failures.push("Audit export chưa lưu filter báo cáo.");
}

if (failures.length) {
  console.error("FAIL verify-audited-export-required");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS verify-audited-export-required: export tài chính đi qua server-side audit trước khi tải file.");
