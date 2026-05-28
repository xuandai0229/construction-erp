import fs from "node:fs";
import path from "node:path";

type Classification =
  | "PUBLIC"
  | "AUTHENTICATED"
  | "PROJECT_SCOPED"
  | "COMPANY_SCOPED"
  | "ACCOUNTING_SENSITIVE"
  | "ADMIN_ONLY"
  | "SUPER_ADMIN_ONLY"
  | "SYSTEM_INTERNAL_ONLY";

const root = process.cwd();
const apiRoot = path.join(root, "app", "api");

const publicAllowList = new Set([
  "app/api/auth/session/route.ts",
  "app/api/health/route.ts",
]);

const authPatterns = [
  "requireAuth(",
  "requireRole(",
  "requirePermission(",
  "requireAdmin(",
  "requireSuperAdmin(",
  "requireAccountingAccess(",
  "requireProjectPermission(",
  "requireProjectAccess(",
  "requireSystemInternalToken(",
  "assertAuthenticated(",
  "assertHasRole(",
  "assertIsAdmin(",
  "assertIsAccountant(",
  "SessionManager.verifySession(",
  "getServerSession(",
];

const sensitiveGuardPatterns = [
  "requireAccountingAccess(",
  "requirePermission(",
  "requireAdmin(",
  "requireSuperAdmin(",
  "requireProjectPermission(",
  "requireSystemInternalToken(",
  "assertHasRole(",
  "assertIsAdmin(",
  "assertIsAccountant(",
  "RBAC.assertPermission(",
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function toRoute(file: string) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function classify(route: string): Classification {
  if (publicAllowList.has(route)) return "PUBLIC";
  if (/\/system\/backup\//.test(route)) return "SUPER_ADMIN_ONLY";
  if (/\/system\/|\/admin\/|\/monitoring\//.test(route)) return "ADMIN_ONLY";
  if (/reports\/(financial|financial-summary|ledger-lines|reconciliation|aging|monthly|period|audit-export)/.test(route)) {
    return "ACCOUNTING_SENSITIVE";
  }
  if (/\/contracts\/|\/tasks\/|\/wbs\/|\/budgets\/|\/costs\/|\/revenues\/|\/invoices\/|\/payments\/|\/procurement\//.test(route)) {
    return "PROJECT_SCOPED";
  }
  if (/\/dashboard\/|\/analytics\/|\/workspace\//.test(route)) return "COMPANY_SCOPED";
  return "AUTHENTICATED";
}

function methods(source: string) {
  const matches = [...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g)];
  return matches.map((match) => match[1]).join(",") || "UNKNOWN";
}

const rows = walk(apiRoot)
  .filter((file) => file.endsWith(`${path.sep}route.ts`))
  .map((file) => {
    const route = toRoute(file);
    const source = fs.readFileSync(file, "utf8");
    const classification = classify(route);
    const hasAuth = authPatterns.some((pattern) => source.includes(pattern));
    const hasSensitiveGuard = sensitiveGuardPatterns.some((pattern) => source.includes(pattern));
    const risky =
      classification !== "PUBLIC" &&
      (!hasAuth ||
        (["ACCOUNTING_SENSITIVE", "ADMIN_ONLY", "SUPER_ADMIN_ONLY", "SYSTEM_INTERNAL_ONLY", "PROJECT_SCOPED"].includes(classification) &&
          !hasSensitiveGuard));

    return {
      route,
      methods: methods(source),
      classification,
      hasAuth,
      hasSensitiveGuard,
      risky,
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

console.table(rows);

const risky = rows.filter((row) => row.risky);
if (risky.length) {
  console.error(`Security route inventory failed: ${risky.length} route(s) need stronger guards.`);
  process.exit(1);
}

console.log(`Security route inventory passed for ${rows.length} route handlers.`);
