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

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

async function isLocked(date: Date, companyId?: string | null) {
  const month = monthKey(date);
  const [accountingPeriod, fiscalPeriod] = await Promise.all([
    companyId
      ? prisma.accountingPeriod.findFirst({
          where: { month, fiscalYear: { companyId } },
          select: { id: true, status: true, month: true },
        })
      : Promise.resolve(null),
    prisma.fiscalPeriod.findFirst({
      where: { month, ...(companyId ? { companyId } : {}) },
      select: { id: true, isLocked: true, month: true },
    }),
  ]);

  return accountingPeriod?.status === "CLOSED" || Boolean(fiscalPeriod?.isLocked);
}

function classify(item: {
  paymentAmount: number;
  invoiceExists: boolean;
  invoiceIncludesPayment: boolean;
  activePostedJournalCount: number;
  totalJournalCount: number;
  journalBalanced: boolean;
  lineAmountMatchesPayment: boolean;
  periodLocked: boolean;
}) {
  if (item.activePostedJournalCount > 1 || item.totalJournalCount > 1) {
    return {
      group: "C",
      recommendation: "Duplicate or multiple payment journals detected. Keep one valid journal and reverse duplicates only through a reviewed accounting reversal.",
      canAutoApply: false,
    };
  }
  if (!item.invoiceExists || !item.journalBalanced || !item.lineAmountMatchesPayment) {
    return {
      group: "D",
      recommendation: "Insufficient evidence for automatic correction. Requires accountant review before changing status or ledger.",
      canAutoApply: false,
    };
  }
  if (item.activePostedJournalCount === 1 && item.invoiceIncludesPayment && !item.periodLocked) {
    return {
      group: "A",
      recommendation: "Existing posted ledger and invoice aggregate match payment. Candidate to align payment status to APPROVED without creating a new journal.",
      canAutoApply: true,
    };
  }
  if (item.activePostedJournalCount === 1 && !item.invoiceIncludesPayment) {
    return {
      group: "B",
      recommendation: "Posted ledger exists but invoice aggregate does not clearly include payment. Do not delete ledger; review for reversal or invoice aggregate correction.",
      canAutoApply: false,
    };
  }
  return {
    group: "D",
    recommendation: "No safe automatic correction path. Requires manual review.",
    canAutoApply: false,
  };
}

export async function buildDraftPostedPaymentsAudit() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });

  const payments = await prisma.payment.findMany({
    where: {
      deletedAt: null,
      approvalStatus: "DRAFT",
      OR: [
        { invoiceId: { not: null } },
        {
          id: {
            in: (
              await prisma.journalEntry.findMany({
                where: { sourceType: "PAYMENT", deletedAt: null, isPosted: true },
                select: { sourceId: true },
              })
            )
              .map((j) => j.sourceId)
              .filter((id): id is string => Boolean(id)),
          },
        },
      ],
    },
    include: {
      invoice: true,
      contract: { select: { id: true, projectId: true, supplierId: true } },
    },
    orderBy: { date: "asc" },
  });

  const rows = [];
  for (const payment of payments) {
    const [project, journals, invoicePayments] = await Promise.all([
      prisma.project.findFirst({ where: { id: payment.projectId }, select: { id: true, companyId: true, name: true } }),
      prisma.journalEntry.findMany({
        where: { sourceType: "PAYMENT", sourceId: payment.id, deletedAt: null },
        include: { lines: { include: { account: { select: { code: true, name: true } } } } },
        orderBy: { date: "asc" },
      }),
      payment.invoiceId
        ? prisma.payment.findMany({
            where: { invoiceId: payment.invoiceId, deletedAt: null },
            select: { id: true, amount: true, approvalStatus: true },
          })
        : Promise.resolve([]),
    ]);

    const companyId = payment.invoice?.companyId || project?.companyId || null;
    const activePostedJournals = journals.filter((j) => j.isPosted && !j.isReversed);
    const debit = activePostedJournals.reduce(
      (sum, journal) => sum + journal.lines.filter((line) => line.type === "DEBIT").reduce((s, line) => s + n(line.amount), 0),
      0,
    );
    const credit = activePostedJournals.reduce(
      (sum, journal) => sum + journal.lines.filter((line) => line.type === "CREDIT").reduce((s, line) => s + n(line.amount), 0),
      0,
    );
    const lineAmountMatchesPayment = activePostedJournals.some((journal) =>
      journal.lines.some((line) => Math.abs(n(line.amount) - n(payment.amount)) <= 0.01),
    );
    const invoicePaidByStatus = invoicePayments.reduce(
      (acc, p) => {
        const key = p.approvalStatus || "UNKNOWN";
        acc[key] = (acc[key] || 0) + n(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );
    const totalInvoicePayments = invoicePayments.reduce((sum, p) => sum + n(p.amount), 0);
    const invoiceIncludesPayment = payment.invoice
      ? Math.abs(n(payment.invoice.paidAmount) - totalInvoicePayments) <= 0.01 ||
        Math.abs(n(payment.invoice.remainingAmount) - Math.max(0, n(payment.invoice.amount) - totalInvoicePayments)) <= 0.01
      : false;
    const periodLocked = await isLocked(payment.date, companyId);
    const decision = classify({
      paymentAmount: n(payment.amount),
      invoiceExists: Boolean(payment.invoice),
      invoiceIncludesPayment,
      activePostedJournalCount: activePostedJournals.length,
      totalJournalCount: journals.length,
      journalBalanced: Math.abs(debit - credit) <= 0.01,
      lineAmountMatchesPayment,
      periodLocked,
    });

    rows.push({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      contractId: payment.contractId || payment.contract?.id || null,
      projectId: payment.projectId,
      companyId,
      amount: n(payment.amount),
      paymentDate: payment.date.toISOString(),
      approvalStatus: payment.approvalStatus,
      journals: journals.map((journal) => ({
        id: journal.id,
        status: journal.status,
        isPosted: journal.isPosted,
        isReversed: journal.isReversed,
        date: journal.date.toISOString(),
        debit: journal.lines.filter((line) => line.type === "DEBIT").reduce((sum, line) => sum + n(line.amount), 0),
        credit: journal.lines.filter((line) => line.type === "CREDIT").reduce((sum, line) => sum + n(line.amount), 0),
        lines: journal.lines.map((line) => ({
          id: line.id,
          type: line.type,
          amount: n(line.amount),
          accountCode: line.account.code,
          accountName: line.account.name,
          description: line.description,
        })),
      })),
      invoice: payment.invoice
        ? {
            totalAmount: n(payment.invoice.amount),
            paidAmount: n(payment.invoice.paidAmount),
            remainingAmount: n(payment.invoice.remainingAmount),
            retentionAmount: n(payment.invoice.retentionAmount),
            status: payment.invoice.status,
            approvalStatus: payment.invoice.approvalStatus,
          }
        : null,
      invoicePaymentTotals: {
        totalAllNonDeleted: totalInvoicePayments,
        byApprovalStatus: invoicePaidByStatus,
      },
      duplicatePosting: activePostedJournals.length > 1 || journals.length > 1,
      periodLocked,
      group: decision.group,
      canAutoApply: decision.canAutoApply,
      recommendation: decision.recommendation,
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: "read-only",
    count: rows.length,
    summary: rows.reduce(
      (acc, row) => {
        acc[row.group] = (acc[row.group] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    rows,
  };

  fs.writeFileSync(path.join(outDir, "draft-posted-payments-audit.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(
    path.join(outDir, "draft-posted-payments-audit.md"),
    [
      "# Draft Posted Payments Audit",
      "",
      `Generated: ${result.generatedAt}`,
      `Mode: ${result.mode}`,
      `Count: ${result.count}`,
      "",
      "| Payment | Invoice | Amount | Status | Journals | Group | Decision |",
      "| ------- | ------- | -----: | ------ | -------- | ----- | -------- |",
      ...rows.map(
        (row) =>
          `| ${row.paymentId} | ${row.invoiceId || ""} | ${row.amount} | ${row.approvalStatus} | ${row.journals.map((j) => `${j.id}:${j.isPosted ? "posted" : "unposted"}:${j.isReversed ? "reversed" : "active"}`).join("<br>")} | ${row.group} | ${row.recommendation} |`,
      ),
      "",
    ].join("\n"),
  );

  return result;
}

buildDraftPostedPaymentsAudit()
  .then((result) => {
    console.log(JSON.stringify({ count: result.count, summary: result.summary }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
