import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditedMarkers = [
  "auditExportOrThrow",
  "auditPrintOrThrow",
  "generateCsvResponse",
  "/api/reports/audited-export",
  "/api/print/audit",
  "auditedCsvExport",
  "useAuditedPrint",
  "assertNonFinancialClientExport",
  "legacyExportCsvNonFinancialOnly"
];
const riskyMarkers = ["exportToCsv", "URL.createObjectURL", "window.print", "Content-Disposition", "text/csv", "download"];

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", "generated", "playwright-report", "test-results"].includes(entry.name)) return [];
      return walk(full);
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [full];
  });
}

const files = walk(root);
const findings = files
  .map(file => {
    const text = fs.readFileSync(file, "utf8");
    const markers = riskyMarkers.filter(marker => text.includes(marker));
    if (markers.length === 0) return null;
    const audited = auditedMarkers.some(marker => text.includes(marker));
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const isFinancial = /cost|budget|debt|revenue|accounting|payment|advance|invoice|ledger|report|export|print/i.test(relative);
    return {
      path: relative,
      markers,
      audited,
      risk: audited ? "LOW" : isFinancial ? "HIGH" : "MEDIUM"
    };
  })
  .filter(Boolean) as Array<{ path: string; markers: string[]; audited: boolean; risk: string }>;

const highRiskUnaudited = findings.filter(item => item.risk === "HIGH" && !item.audited);

console.log(JSON.stringify({
  status: highRiskUnaudited.length ? "WARNING" : "PASS",
  totalFindings: findings.length,
  highRiskUnaudited: highRiskUnaudited.length,
  findings
}, null, 2));
