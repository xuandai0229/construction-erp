import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../generated/prisma-client";
import { FinancialAggregationService } from "../../services/financial-aggregation.service";

const prisma = new PrismaClient();
const outDir = path.join(process.cwd(), "docs", "audit");

type Check = {
  area: string;
  expected: number | string;
  actual: number | string;
  difference: number | string;
  result: "PASS" | "FAIL";
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  notes: string;
  suspectFile?: string;
};

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), name);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      if (!process.env[key]) process.env[key] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function n(value: unknown) {
  return Number(value || 0);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function checkNumber(area: string, expected: number, actual: number, notes: string, suspectFile?: string, severity: Check["severity"] = "CRITICAL"): Check {
  const difference = round(actual - expected);
  return {
    area,
    expected: round(expected),
    actual: round(actual),
    difference,
    result: Math.abs(difference) <= 0.01 ? "PASS" : "FAIL",
    severity,
    notes,
    suspectFile,
  };
}

async function sumLines(projectId: string | null, accountPrefix: string, type?: "DEBIT" | "CREDIT") {
  const result = await prisma.transactionLine.aggregate({
    where: {
      deletedAt: null,
      ...(type ? { type } : {}),
      account: { code: { startsWith: accountPrefix } },
      journalEntry: {
        deletedAt: null,
        isPosted: true,
        isReversed: false,
        ...(projectId ? { projectId } : {}),
      },
    },
    _sum: { amount: true },
  });
  return n(result._sum.amount);
}

async function ledgerDebitCredit(projectId: string | null) {
  const [debit, credit] = await Promise.all([
    prisma.transactionLine.aggregate({
      where: {
        type: "DEBIT",
        deletedAt: null,
        journalEntry: { deletedAt: null, isPosted: true, isReversed: false, ...(projectId ? { projectId } : {}) },
      },
      _sum: { amount: true },
    }),
    prisma.transactionLine.aggregate({
      where: {
        type: "CREDIT",
        deletedAt: null,
        journalEntry: { deletedAt: null, isPosted: true, isReversed: false, ...(projectId ? { projectId } : {}) },
      },
      _sum: { amount: true },
    }),
  ]);
  return { debit: n(debit._sum.amount), credit: n(credit._sum.amount) };
}

async function runProjectChecks(projectId: string, companyId: string | null) {
  const checks: Check[] = [];
  const ledger = await ledgerDebitCredit(projectId);
  checks.push(checkNumber(`Ledger balanced (${projectId})`, ledger.debit, ledger.credit, "Posted, unreversed, non-deleted debit/credit totals must match."));

  const canonical = await FinancialAggregationService.getCanonicalProjectFinancials(projectId);
  const [revenueCredit, revenueDebit, costDebit, costCredit, arDebit, arCredit, apCredit, apDebit] = await Promise.all([
    sumLines(projectId, "511", "CREDIT"),
    sumLines(projectId, "511", "DEBIT"),
    Promise.all(["621", "622", "623", "627"].map((prefix) => sumLines(projectId, prefix, "DEBIT"))).then((items) => items.reduce((sum, item) => sum + item, 0)),
    Promise.all(["621", "622", "623", "627"].map((prefix) => sumLines(projectId, prefix, "CREDIT"))).then((items) => items.reduce((sum, item) => sum + item, 0)),
    sumLines(projectId, "131", "DEBIT"),
    sumLines(projectId, "131", "CREDIT"),
    sumLines(projectId, "331", "CREDIT"),
    sumLines(projectId, "331", "DEBIT"),
  ]);

  const postedRevenue = revenueCredit - revenueDebit;
  const postedCost = costDebit - costCredit;
  const arBalance = arDebit - arCredit;
  const apBalance = apCredit - apDebit;

  checks.push(checkNumber(`Revenue ledger vs canonical (${projectId})`, postedRevenue, canonical.totalRevenue, "Posted revenue must come from 511* ledger only.", "services/financial-aggregation.service.ts"));
  checks.push(checkNumber(`Cost ledger vs canonical (${projectId})`, postedCost, canonical.totalCost, "Posted cost must come from 621/622/623/627 ledger only.", "services/financial-aggregation.service.ts"));
  checks.push(checkNumber(`AR ledger vs canonical (${projectId})`, arBalance, canonical.totalContractReceivable, "AR must reconcile to 131* active posted ledger.", "services/financial-aggregation.service.ts"));

  const draftPaymentJournals = await prisma.journalEntry.count({
    where: {
      sourceType: "PAYMENT",
      deletedAt: null,
      isPosted: true,
      isReversed: false,
      sourceId: {
        in: (
          await prisma.payment.findMany({
            where: { projectId, deletedAt: null, approvalStatus: { not: "APPROVED" } },
            select: { id: true },
          })
        ).map((payment) => payment.id),
      },
    },
  });
  checks.push(checkNumber(`Draft/rejected payments excluded from ledger (${projectId})`, 0, draftPaymentJournals, "No non-approved payment should have active posted journal."));

  const draftInvoiceRevenueJournals = await prisma.journalEntry.count({
    where: {
      sourceType: "INVOICE",
      deletedAt: null,
      isPosted: true,
      isReversed: false,
      sourceId: {
        in: (
          await prisma.invoice.findMany({
            where: { projectId, deletedAt: null, approvalStatus: { not: "APPROVED" } },
            select: { id: true },
          })
        ).map((invoice) => invoice.id),
      },
    },
  });
  checks.push(checkNumber(`Draft invoices excluded from posted revenue (${projectId})`, 0, draftInvoiceRevenueJournals, "No non-approved invoice should have active posted revenue journal."));

  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { companyId: true } });
  checks.push({
    area: `Tenant scope evidence (${projectId})`,
    expected: companyId || "GLOBAL",
    actual: project?.companyId || "GLOBAL",
    difference: project?.companyId === companyId ? 0 : "review",
    result: project?.companyId === companyId ? "PASS" : companyId ? "FAIL" : "PASS",
    severity: "HIGH",
    notes: "Project reconciliation was scoped per project/company available in database.",
  });

  checks.push({
    area: `Project P&L layers (${projectId})`,
    expected: "separate posted and exposure layers",
    actual: canonical.reconciliation ? "separate posted and exposure layers" : "missing reconciliation layer",
    difference: 0,
    result: canonical.reconciliation ? "PASS" : "FAIL",
    severity: "HIGH",
    notes: `Posted P&L=${round(postedRevenue - postedCost)}, AP balance=${round(apBalance)}. Management exposure remains separate in canonical reconciliation payload.`,
    suspectFile: "services/financial-aggregation.service.ts",
  });

  return checks;
}

function inspectDashboardSources(): Check[] {
  const dashboard = fs.readFileSync(path.join(process.cwd(), "app", "components", "FinancialIntegrityDashboard.tsx"), "utf8");
  const statsRoute = fs.readFileSync(path.join(process.cwd(), "app", "api", "dashboard", "stats", "route.ts"), "utf8");
  const noSyncedStatic = !dashboard.includes("'SYNCED'") && !dashboard.includes("lockedPeriodWarnings = 0");
  const sourceVisible = statsRoute.includes("FinancialAggregationService.getCanonicalProjectFinancials") && statsRoute.includes("reconciliationStatus");
  return [
    {
      area: "Dashboard integrity static values",
      expected: "no static SYNCED/lockedPeriodWarnings=0",
      actual: noSyncedStatic ? "no static integrity success" : "static integrity signal found",
      difference: 0,
      result: noSyncedStatic ? "PASS" : "FAIL",
      severity: "HIGH",
      notes: "Dashboard must show no-data or real reconciliation signal instead of fake synced status.",
      suspectFile: "app/components/FinancialIntegrityDashboard.tsx",
    },
    {
      area: "Dashboard KPI source",
      expected: "FinancialAggregationService/reconciliationStatus",
      actual: sourceVisible ? "FinancialAggregationService/reconciliationStatus" : "unclear source",
      difference: 0,
      result: sourceVisible ? "PASS" : "FAIL",
      severity: "HIGH",
      notes: "Dashboard stats route must use a source service, workflow counts, or no-data state.",
      suspectFile: "app/api/dashboard/stats/route.ts",
    },
  ];
}

async function main() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });
  const projects = await prisma.project.findMany({ where: { deletedAt: null }, select: { id: true, companyId: true, name: true } });
  const checks: Check[] = [];

  const globalLedger = await ledgerDebitCredit(null);
  checks.push(checkNumber("Ledger balanced (global)", globalLedger.debit, globalLedger.credit, "All posted, unreversed, non-deleted journal lines must balance globally."));

  for (const project of projects) {
    checks.push(...(await runProjectChecks(project.id, project.companyId)));
  }

  checks.push(...inspectDashboardSources());

  const failed = checks.filter((check) => check.result === "FAIL");
  const critical = failed.filter((check) => check.severity === "CRITICAL");
  const result = {
    generatedAt: new Date().toISOString(),
    projects: projects.length,
    summary: {
      total: checks.length,
      pass: checks.filter((check) => check.result === "PASS").length,
      fail: failed.length,
      critical: critical.length,
    },
    checks,
  };

  fs.writeFileSync(path.join(outDir, "full-report-reconciliation.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "full-report-reconciliation.md"),
    [
      "# Full Report Reconciliation",
      "",
      `Generated: ${result.generatedAt}`,
      `Projects checked: ${result.projects}`,
      "",
      "| Report/KPI | Expected | Actual | Difference | Result | Notes |",
      "| ---------- | -------: | -----: | ---------: | ------ | ----- |",
      ...checks.map((check) => `| ${check.area} | ${check.expected} | ${check.actual} | ${check.difference} | ${check.result} | ${check.notes}${check.suspectFile ? ` Suspect: ${check.suspectFile}.` : ""} |`),
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(result.summary, null, 2));
  if (critical.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
