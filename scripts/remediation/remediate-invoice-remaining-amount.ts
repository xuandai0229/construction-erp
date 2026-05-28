import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../generated/prisma-client";

const prisma = new PrismaClient();
const outDir = path.join(process.cwd(), "docs", "audit");

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

function isApplyMode() {
  return process.argv.includes("--apply");
}

function assertApplyAllowed() {
  if (process.env.ALLOW_ACCOUNTING_REMEDIATION !== "true") {
    throw new Error("Apply blocked: ALLOW_ACCOUNTING_REMEDIATION=true is required.");
  }
  if (process.env.REMEDIATION_CONFIRMATION !== "FIX_INVOICE_REMAINING") {
    throw new Error("Apply blocked: REMEDIATION_CONFIRMATION=FIX_INVOICE_REMAINING is required.");
  }
}

async function buildMismatchRows() {
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: { payments: { where: { deletedAt: null } } },
    orderBy: { issuedDate: "asc" },
  });

  const rows = [];
  for (const invoice of invoices) {
    const paymentIds = invoice.payments.map((payment) => payment.id);
    const journals = await prisma.journalEntry.findMany({
      where: {
        deletedAt: null,
        sourceType: "PAYMENT",
        sourceId: { in: paymentIds },
      },
      select: { sourceId: true, isPosted: true, isReversed: true },
    });
    const activePostedPaymentIds = new Set(
      journals.filter((journal) => journal.isPosted && !journal.isReversed).map((journal) => journal.sourceId).filter(Boolean),
    );
    const approvedPostedPayments = invoice.payments.filter(
      (payment) => payment.approvalStatus === "APPROVED" && activePostedPaymentIds.has(payment.id),
    );
    const expectedPaidAmount = round(approvedPostedPayments.reduce((sum, payment) => sum + n(payment.amount), 0));
    const expectedRemainingAmount = round(Math.max(0, n(invoice.amount) - expectedPaidAmount));
    const paidDelta = round(n(invoice.paidAmount) - expectedPaidAmount);
    const remainingDelta = round(n(invoice.remainingAmount) - expectedRemainingAmount);
    const expectedStatus = expectedRemainingAmount <= 0
      ? "PAID"
      : expectedPaidAmount > 0
        ? "PARTIAL"
        : invoice.approvalStatus === "APPROVED"
          ? "SENT"
          : "DRAFT";
    const statusMismatch = invoice.status !== expectedStatus;
    if (Math.abs(paidDelta) <= 0.01 && Math.abs(remainingDelta) <= 0.01 && !statusMismatch) continue;

    rows.push({
      invoice,
      expectedPaidAmount,
      expectedRemainingAmount,
      expectedStatus,
      paidDelta,
      remainingDelta,
      retentionAmount: n(invoice.retentionAmount),
      approvedPostedPayments: expectedPaidAmount,
      draftPayments: invoice.payments.filter((payment) => payment.approvalStatus === "DRAFT" || payment.approvalStatus === "PENDING").reduce((sum, payment) => sum + n(payment.amount), 0),
      cancelledPayments: invoice.payments.filter((payment) => payment.approvalStatus === "REJECTED" || payment.approvalStatus === "CANCELLED").reduce((sum, payment) => sum + n(payment.amount), 0),
    });
  }
  return rows;
}

async function main() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });
  const apply = isApplyMode();
  if (apply) assertApplyAllowed();

  const rows = await buildMismatchRows();
  const reportRows = [];

  for (const row of rows) {
    const before = {
      paidAmount: n(row.invoice.paidAmount),
      remainingAmount: n(row.invoice.remainingAmount),
      status: row.invoice.status,
      version: row.invoice.version,
    };
    const after = {
      paidAmount: row.expectedPaidAmount,
      remainingAmount: row.expectedRemainingAmount,
      status: row.expectedStatus,
    };

    if (row.retentionAmount > 0) {
      reportRows.push({
        invoiceId: row.invoice.id,
        before,
        after: before,
        action: "manual-review",
        result: "SKIPPED",
        reason: "Invoice has retention amount; automatic remaining remediation is blocked.",
      });
      continue;
    }

    if (!apply) {
      reportRows.push({
        invoiceId: row.invoice.id,
        before,
        after,
        action: "recalculate-paid-and-remaining",
        result: "DRY_RUN",
        reason: "Would recalculate from APPROVED payments with active posted journals only.",
      });
      continue;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.invoice.update({
        where: { id: row.invoice.id, version: row.invoice.version },
        data: {
          paidAmount: after.paidAmount,
          remainingAmount: after.remainingAmount,
          status: after.status as "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE",
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: null,
          action: "UPDATE",
          entity: "Invoice",
          entityId: row.invoice.id,
          oldData: row.invoice as object,
          newData: changed as object,
          reason: "Historical remediation: invoice paidAmount/remainingAmount recalculated from APPROVED payments with active posted journals only.",
          severity: "CRITICAL",
        },
      });
      return changed;
    });

    reportRows.push({
      invoiceId: row.invoice.id,
      before,
      after: {
        paidAmount: n(updated.paidAmount),
        remainingAmount: n(updated.remainingAmount),
        status: updated.status,
      },
      action: "recalculate-paid-and-remaining",
      result: "APPLIED",
      auditLog: "Invoice UPDATE audit log created",
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

  fs.writeFileSync(path.join(outDir, "invoice-remaining-remediation-report.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "invoice-remaining-remediation-report.md"),
    [
      "# Invoice Remaining Remediation Report",
      "",
      `Generated: ${result.generatedAt}`,
      `Mode: ${result.mode}`,
      "",
      "| Invoice | Before Paid | Before Remaining | After Paid | After Remaining | Action | Result |",
      "| ------- | ----------: | ---------------: | ---------: | --------------: | ------ | ------ |",
      ...reportRows.map(
        (row) =>
          `| ${row.invoiceId} | ${row.before.paidAmount} | ${row.before.remainingAmount} | ${row.after.paidAmount} | ${row.after.remainingAmount} | ${row.action} | ${row.result} |`,
      ),
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
