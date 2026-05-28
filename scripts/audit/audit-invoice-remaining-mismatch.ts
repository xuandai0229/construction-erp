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

export async function buildInvoiceRemainingAudit() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });

  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: {
      payments: {
        where: { deletedAt: null },
        include: {
          allocations: { where: { isReversed: false } },
        },
      },
    },
    orderBy: { issuedDate: "asc" },
  });

  const rows = [];
  for (const invoice of invoices) {
    const journals = await prisma.journalEntry.findMany({
      where: {
        deletedAt: null,
        OR: [
          { sourceType: "INVOICE", sourceId: invoice.id },
          { sourceType: "PAYMENT", sourceId: { in: invoice.payments.map((payment) => payment.id) } },
        ],
      },
      include: { lines: { include: { account: { select: { code: true, name: true } } } } },
    });

    const postedApprovedPayments = invoice.payments.filter((payment) => {
      const hasActivePostedJournal = journals.some(
        (journal) => journal.sourceType === "PAYMENT" && journal.sourceId === payment.id && journal.isPosted && !journal.isReversed,
      );
      return payment.approvalStatus === "APPROVED" && hasActivePostedJournal;
    });
    const draftPayments = invoice.payments.filter((payment) => payment.approvalStatus === "DRAFT" || payment.approvalStatus === "PENDING");
    const cancelledPayments = invoice.payments.filter((payment) => payment.approvalStatus === "REJECTED" || payment.approvalStatus === "CANCELLED");
    const reversedPaymentIds = new Set(
      journals
        .filter((journal) => journal.sourceType === "PAYMENT" && journal.isReversed)
        .map((journal) => journal.sourceId)
        .filter(Boolean),
    );
    const activeApprovedCollection = postedApprovedPayments
      .filter((payment) => !reversedPaymentIds.has(payment.id))
      .reduce((sum, payment) => sum + n(payment.amount), 0);
    const draftTotal = draftPayments.reduce((sum, payment) => sum + n(payment.amount), 0);
    const rejectedOrCancelledTotal = cancelledPayments.reduce((sum, payment) => sum + n(payment.amount), 0);
    const retentionAmount = n(invoice.retentionAmount);
    const expectedPaidAmount = round(activeApprovedCollection);
    const expectedRemainingAmount = round(Math.max(0, n(invoice.amount) - expectedPaidAmount));
    const paidDelta = round(n(invoice.paidAmount) - expectedPaidAmount);
    const remainingDelta = round(n(invoice.remainingAmount) - expectedRemainingAmount);

    if (Math.abs(paidDelta) > 0.01 || Math.abs(remainingDelta) > 0.01) {
      const hasDraftPosted = draftPayments.some((payment) =>
        journals.some((journal) => journal.sourceType === "PAYMENT" && journal.sourceId === payment.id && journal.isPosted && !journal.isReversed),
      );
      const suspectedReason = hasDraftPosted
        ? "Invoice aggregate likely includes DRAFT payment that was historically posted."
        : retentionAmount > 0
          ? "Invoice has retention; requires accountant review before automatic correction."
          : "Invoice aggregate differs from approved posted collections.";

      rows.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        projectId: invoice.projectId,
        companyId: invoice.companyId,
        totalAmount: n(invoice.amount),
        paidAmountCurrent: n(invoice.paidAmount),
        remainingAmountCurrent: n(invoice.remainingAmount),
        retentionAmount,
        postedApprovedPayments: activeApprovedCollection,
        draftPayments: draftTotal,
        rejectedOrCancelledPayments: rejectedOrCancelledTotal,
        reversedPaymentIds: [...reversedPaymentIds],
        expectedPaidAmount,
        expectedRemainingAmount,
        paidDelta,
        remainingDelta,
        suspectedReason,
        payments: invoice.payments.map((payment) => ({
          id: payment.id,
          amount: n(payment.amount),
          approvalStatus: payment.approvalStatus,
          hasActivePostedJournal: journals.some(
            (journal) => journal.sourceType === "PAYMENT" && journal.sourceId === payment.id && journal.isPosted && !journal.isReversed,
          ),
        })),
        journals: journals.map((journal) => ({
          id: journal.id,
          sourceType: journal.sourceType,
          sourceId: journal.sourceId,
          isPosted: journal.isPosted,
          isReversed: journal.isReversed,
          lines: journal.lines.map((line) => ({
            accountCode: line.account.code,
            type: line.type,
            amount: n(line.amount),
          })),
        })),
        canAutoApply: retentionAmount === 0,
      });
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: "read-only",
    count: rows.length,
    rows,
  };

  fs.writeFileSync(path.join(outDir, "invoice-remaining-mismatch-audit.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "invoice-remaining-mismatch-audit.md"),
    [
      "# Invoice Remaining Mismatch Audit",
      "",
      `Generated: ${result.generatedAt}`,
      `Mode: ${result.mode}`,
      `Count: ${result.count}`,
      "",
      "| Invoice | Total | Paid Current | Remaining Current | Expected Paid | Expected Remaining | Delta | Suspected Reason |",
      "| ------- | ----: | -----------: | ----------------: | ------------: | -----------------: | ----: | ---------------- |",
      ...rows.map(
        (row) =>
          `| ${row.invoiceId} | ${row.totalAmount} | ${row.paidAmountCurrent} | ${row.remainingAmountCurrent} | ${row.expectedPaidAmount} | ${row.expectedRemainingAmount} | ${row.remainingDelta} | ${row.suspectedReason} |`,
      ),
      "",
    ].join("\n"),
  );

  return result;
}

buildInvoiceRemainingAudit()
  .then((result) => console.log(JSON.stringify({ count: result.count }, null, 2)))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
