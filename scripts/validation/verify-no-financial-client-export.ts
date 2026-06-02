import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const markers = ["exportToCsv", "URL.createObjectURL", "text/csv", "download", "window.print"];
const auditedMarkers = [
  "/api/reports/audited-export",
  "auditedCsvExport",
  "auditExportOrThrow",
  "generateCsvResponse",
  "/api/print/audit",
  "useAuditedPrint",
  "auditPrintOrThrow"
];
const nonFinancialGuardMarkers = ["assertNonFinancialClientExport", "legacyExportCsvNonFinancialOnly"];
const financialPathPattern = /cost|budget|debt|revenue|accounting|payment|advance|invoice|ledger|cash|bank|journal|report|print/i;

const allowedNonFinancial = new Set([
  "app/components/projects/ProjectFilters.tsx",
  "app/system/page.tsx",
]);

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

const findings = walk(root)
  .map(file => {
    const text = fs.readFileSync(file, "utf8");
    const fileMarkers = markers.filter(marker => text.includes(marker));
    if (fileMarkers.length === 0) return null;
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const audited = auditedMarkers.some(marker => text.includes(marker));
    const guardedLegacy = nonFinancialGuardMarkers.some(marker => text.includes(marker));
    const allowed = allowedNonFinancial.has(relative);
    const financial = financialPathPattern.test(relative);
    const classification = audited
      ? "audited wrapper"
      : guardedLegacy
        ? "allowed non-financial guarded helper"
        : allowed
          ? "allowed non-financial"
          : financial
            ? "forbidden financial usage"
            : "needs manual review";
    return { path: relative, markers: fileMarkers, classification };
  })
  .filter(Boolean) as Array<{ path: string; markers: string[]; classification: string }>;

const forbidden = findings.filter(item => item.classification === "forbidden financial usage");

console.log(JSON.stringify({
  status: forbidden.length ? "WARNING" : "PASS",
  counts: {
    totalFindings: findings.length,
    forbiddenFinancialUsage: forbidden.length,
    auditedWrapper: findings.filter(item => item.classification === "audited wrapper").length,
    guardedLegacy: findings.filter(item => item.classification === "allowed non-financial guarded helper").length,
    allowedNonFinancial: findings.filter(item => item.classification === "allowed non-financial").length,
    needsManualReview: findings.filter(item => item.classification === "needs manual review").length,
  },
  findings,
}, null, 2));
