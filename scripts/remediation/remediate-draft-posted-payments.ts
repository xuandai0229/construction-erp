import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../generated/prisma-client";

const prisma = new PrismaClient();
const outDir = path.join(process.cwd(), "docs", "audit");
const auditPath = path.join(outDir, "draft-posted-payments-audit.json");

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

function isApplyMode() {
  return process.argv.includes("--apply");
}

function assertApplyAllowed() {
  if (process.env.ALLOW_ACCOUNTING_REMEDIATION !== "true") {
    throw new Error("Apply blocked: ALLOW_ACCOUNTING_REMEDIATION=true is required.");
  }
  if (process.env.REMEDIATION_CONFIRMATION !== "FIX_DRAFT_POSTED_PAYMENTS") {
    throw new Error("Apply blocked: REMEDIATION_CONFIRMATION=FIX_DRAFT_POSTED_PAYMENTS is required.");
  }
}

async function verifySafeCandidate(paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, deletedAt: null },
    include: { invoice: true },
  });
  if (!payment) return { ok: false, reason: "Payment not found or deleted." };
  if (payment.approvalStatus !== "DRAFT") return { ok: false, reason: `Payment status is ${payment.approvalStatus}, not DRAFT.` };
  if (!payment.invoice) return { ok: false, reason: "Missing source invoice." };

  const [journals, invoicePayments] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { sourceType: "PAYMENT", sourceId: payment.id, deletedAt: null },
      include: { lines: true },
    }),
    prisma.payment.findMany({ where: { invoiceId: payment.invoiceId, deletedAt: null }, select: { amount: true } }),
  ]);

  const activePosted = journals.filter((journal) => journal.isPosted && !journal.isReversed);
  const debit = activePosted.reduce(
    (sum, journal) => sum + journal.lines.filter((line) => line.type === "DEBIT").reduce((s, line) => s + n(line.amount), 0),
    0,
  );
  const credit = activePosted.reduce(
    (sum, journal) => sum + journal.lines.filter((line) => line.type === "CREDIT").reduce((s, line) => s + n(line.amount), 0),
    0,
  );
  const totalInvoicePayments = invoicePayments.reduce((sum, p) => sum + n(p.amount), 0);
  const invoiceIncludesPayment =
    Math.abs(n(payment.invoice.paidAmount) - totalInvoicePayments) <= 0.01 ||
    Math.abs(n(payment.invoice.remainingAmount) - Math.max(0, n(payment.invoice.amount) - totalInvoicePayments)) <= 0.01;
  const lineMatchesAmount = activePosted.some((journal) => journal.lines.some((line) => Math.abs(n(line.amount) - n(payment.amount)) <= 0.01));

  if (activePosted.length !== 1 || journals.length !== 1) return { ok: false, reason: "Expected exactly one active posted journal." };
  if (Math.abs(debit - credit) > 0.01) return { ok: false, reason: "Journal is not balanced." };
  if (!lineMatchesAmount) return { ok: false, reason: "Journal lines do not match payment amount." };
  if (!invoiceIncludesPayment) return { ok: false, reason: "Invoice aggregate does not include payment consistently." };

  return { ok: true, payment, journalId: activePosted[0].id };
}

async function main() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });
  const apply = isApplyMode();
  if (apply) assertApplyAllowed();
  if (!fs.existsSync(auditPath)) {
    throw new Error("Missing draft-posted-payments audit report. Run scripts/audit/audit-draft-posted-payments.ts first.");
  }

  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8")) as {
    rows: Array<{ paymentId: string; group: string; canAutoApply: boolean; recommendation: string }>;
  };
  const reportRows = [];

  for (const row of audit.rows) {
    const before = await prisma.payment.findUnique({ where: { id: row.paymentId } });
    if (row.group !== "A" || !row.canAutoApply) {
      reportRows.push({
        paymentId: row.paymentId,
        before: before?.approvalStatus || null,
        after: before?.approvalStatus || null,
        action: "manual-review",
        result: "SKIPPED",
        reason: row.recommendation,
      });
      continue;
    }

    const verification = await verifySafeCandidate(row.paymentId);
    if (!verification.ok || !("payment" in verification)) {
      reportRows.push({
        paymentId: row.paymentId,
        before: before?.approvalStatus || null,
        after: before?.approvalStatus || null,
        action: "manual-review",
        result: "SKIPPED",
        reason: verification.reason,
      });
      continue;
    }

    if (!apply) {
      reportRows.push({
        paymentId: row.paymentId,
        before: "DRAFT",
        after: "APPROVED",
        action: "align-status",
        result: "DRY_RUN",
        reason: "Would align payment status with existing posted ledger; no new journal would be created.",
        journalId: verification.journalId,
      });
      continue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.payment.update({
        where: { id: row.paymentId, version: verification.payment.version },
        data: { approvalStatus: "APPROVED", version: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          userId: null,
          action: "UPDATE",
          entity: "Payment",
          entityId: row.paymentId,
          oldData: verification.payment as object,
          newData: changed as object,
          reason: "Historical remediation: status aligned with existing posted ledger. No new ledger was created.",
          severity: "CRITICAL",
        },
      });
      return changed;
    });

    reportRows.push({
      paymentId: row.paymentId,
      before: "DRAFT",
      after: updated.approvalStatus,
      action: "align-status",
      result: "APPLIED",
      auditLog: "Payment UPDATE audit log created",
      journalId: verification.journalId,
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : "dry-run",
    rows: reportRows,
    summary: reportRows.reduce(
      (acc, row) => {
        acc[row.result] = (acc[row.result] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  fs.writeFileSync(path.join(outDir, "draft-posted-payments-remediation-report.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "draft-posted-payments-remediation-report.md"),
    [
      "# Draft Posted Payments Remediation Report",
      "",
      `Generated: ${result.generatedAt}`,
      `Mode: ${result.mode}`,
      "",
      "| Payment | Before | After | Action | Result | Reason |",
      "| ------- | ------ | ----- | ------ | ------ | ------ |",
      ...reportRows.map((row) => `| ${row.paymentId} | ${row.before} | ${row.after} | ${row.action} | ${row.result} | ${row.reason || row.auditLog || ""} |`),
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(result.summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
