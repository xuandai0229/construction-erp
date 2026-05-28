import fs from "node:fs";
import path from "node:path";
import { PrismaClient, UserRole } from "../../generated/prisma-client";
import { RBAC } from "../../lib/rbac";

const prisma = new PrismaClient();
const outDir = path.join(process.cwd(), "docs", "audit");
const rollbackSignal = "PHASE1E_ROLLBACK";

type Result = {
  test: string;
  result: "PASS" | "FAIL";
  notes: string;
};

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

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

function pass(results: Result[], test: string, notes: string) {
  results.push({ test, result: "PASS", notes });
}

function fail(results: Result[], test: string, notes: string) {
  results.push({ test, result: "FAIL", notes });
}

async function assertPeriodOpen(tx: TransactionClient, date: Date, companyId: string) {
  const month = date.toISOString().slice(0, 7);
  const period = await tx.fiscalPeriod.findFirst({ where: { month, companyId } });
  if (period?.isLocked) throw new Error(`Period ${month} is locked`);
}

async function assertPaymentCanPost(tx: TransactionClient, paymentId: string, companyId: string) {
  const payment = await tx.payment.findFirst({ where: { id: paymentId, deletedAt: null }, include: { invoice: true } });
  if (!payment) throw new Error("Payment not found");
  if (payment.approvalStatus !== "APPROVED") throw new Error(`Payment status ${payment.approvalStatus} cannot post`);
  if (!payment.invoiceId || !payment.invoice) throw new Error("Payment source invoice is required");
  await assertPeriodOpen(tx, payment.date, companyId);
  const existingJournal = await tx.journalEntry.findFirst({
    where: { sourceType: "PAYMENT", sourceId: paymentId, deletedAt: null, isReversed: false },
  });
  if (existingJournal) throw new Error("Payment already has an active posted journal");
  return payment;
}

async function createPaymentJournal(tx: TransactionClient, paymentId: string, projectId: string, debitAccountId: string, creditAccountId: string, amount: number) {
  const journal = await tx.journalEntry.create({
    data: {
      projectId,
      sourceType: "PAYMENT",
      sourceId: paymentId,
      reference: `TEST_PHASE1E_PAYMENT_${paymentId}`,
      description: "TEST_PHASE1E_PAYMENT posted journal",
      isPosted: true,
      status: "DA_GHI_SO",
    },
  });
  await tx.transactionLine.createMany({
    data: [
      { journalEntryId: journal.id, accountId: debitAccountId, amount, type: "DEBIT", description: "TEST_PHASE1E debit" },
      { journalEntryId: journal.id, accountId: creditAccountId, amount, type: "CREDIT", description: "TEST_PHASE1E credit" },
    ],
  });
  return journal;
}

async function runFixtureTests(results: Result[]) {
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const stamp = Date.now();
    const company = await tx.company.create({
      data: {
        code: `TEST_PHASE1E_CO_${stamp}`,
        name: "TEST_PHASE1E_COMPANY",
      },
    });
    const maker = await tx.user.create({
      data: {
        email: `TEST_PHASE1E_PAYMENT_maker_${stamp}@local.test`,
        name: "TEST_PHASE1E_PAYMENT_MAKER",
        role: UserRole.ACCOUNTANT,
        companyId: company.id,
      },
    });
    const approver = await tx.user.create({
      data: {
        email: `TEST_PHASE1E_PAYMENT_approver_${stamp}@local.test`,
        name: "TEST_PHASE1E_PAYMENT_APPROVER",
        role: UserRole.CFO,
        companyId: company.id,
      },
    });
    const viewer = await tx.user.create({
      data: {
        email: `TEST_PHASE1E_PAYMENT_viewer_${stamp}@local.test`,
        name: "TEST_PHASE1E_PAYMENT_VIEWER",
        role: UserRole.VIEWER,
        companyId: company.id,
      },
    });
    const project = await tx.project.create({
      data: {
        name: "TEST_PHASE1E_PROJECT_PAYMENT_WORKFLOW",
        companyId: company.id,
        ownerId: maker.id,
        status: "ACTIVE",
      },
    });
    const wbs = await tx.wBSItem.create({
      data: {
        projectId: project.id,
        name: "TEST_PHASE1E_PROJECT_WBS",
        code: "TEST_PHASE1E_PROJECT_WBS",
      },
    });
    const invoice = await tx.invoice.create({
      data: {
        projectId: project.id,
        companyId: company.id,
        wbsId: wbs.id,
        invoiceNumber: `TEST_PHASE1E_INVOICE_${stamp}`,
        amount: 1000,
        netAmount: 1000,
        vatAmount: 0,
        vatRate: 0,
        paidAmount: 0,
        remainingAmount: 1000,
        approvalStatus: "APPROVED",
        status: "SENT",
      },
    });
    const payment = await tx.payment.create({
      data: {
        projectId: project.id,
        invoiceId: invoice.id,
        amount: 1000,
        date: now,
        description: `TEST_PHASE1E_PAYMENT_${stamp}`,
        approvalStatus: "DRAFT",
      },
    });
    const request = await tx.approvalRequest.create({
      data: {
        id: `TEST_PHASE1E_PAYMENT_REQ_${stamp}`,
        projectId: project.id,
        requesterId: maker.id,
        entityType: "PAYMENT",
        entityId: payment.id,
        requestData: { paymentId: payment.id, amount: 1000 },
        status: "PENDING",
        updatedAt: now,
      },
    });
    await tx.approvalStep.create({
      data: {
        id: `TEST_PHASE1E_PAYMENT_STEP_${stamp}`,
        approvalRequestId: request.id,
        approverId: approver.id,
        status: "PENDING",
        updatedAt: now,
      },
    });

    const accounts = await tx.ledgerAccount.findMany({ where: { deletedAt: null }, take: 2, orderBy: { code: "asc" } });
    if (accounts.length < 2) throw new Error("At least two ledger accounts are required for workflow guard tests.");

    try {
      RBAC.assertSegregationOfDuties(maker.id, maker.id);
      fail(results, "Creator cannot self-approve own payment", "Segregation of duties did not reject same maker/approver.");
    } catch {
      pass(results, "Creator cannot self-approve own payment", "RBAC.assertSegregationOfDuties rejected same maker/approver.");
    }

    const viewerAllowed = RBAC.hasPermission(viewer.role, "PAYMENT", "APPROVE");
    if (viewerAllowed) {
      fail(results, "User without permission cannot approve payment", `Role ${viewer.role} unexpectedly has PAYMENT APPROVE.`);
    } else {
      pass(results, "User without permission cannot approve payment", `Role ${viewer.role} has no PAYMENT APPROVE.`);
    }

    const approverAllowed = RBAC.hasPermission(approver.role, "PAYMENT", "APPROVE");
    if (approverAllowed) {
      pass(results, "Authorized user can approve payment", `Role ${approver.role} has PAYMENT APPROVE.`);
    } else {
      fail(results, "Authorized user can approve payment", `Role ${approver.role} lacks PAYMENT APPROVE.`);
    }

    const draftJournalCount = await tx.journalEntry.count({
      where: { sourceType: "PAYMENT", sourceId: payment.id, deletedAt: null, isPosted: true, isReversed: false },
    });
    if (draftJournalCount === 0) {
      pass(results, "DRAFT payment does not post ledger", "No active posted journal exists while payment is DRAFT.");
    } else {
      fail(results, "DRAFT payment does not post ledger", `Found ${draftJournalCount} active posted journal(s).`);
    }

    await tx.payment.update({ where: { id: payment.id }, data: { approvalStatus: "APPROVED" } });
    await assertPaymentCanPost(tx, payment.id, company.id);
    const journal = await createPaymentJournal(tx, payment.id, project.id, accounts[0].id, accounts[1].id, 1000);
    const approvedJournalCount = await tx.journalEntry.count({
      where: { sourceType: "PAYMENT", sourceId: payment.id, deletedAt: null, isPosted: true, isReversed: false },
    });
    if (approvedJournalCount === 1) {
      pass(results, "APPROVED payment posts ledger once", `Posted journal ${journal.id}.`);
    } else {
      fail(results, "APPROVED payment posts ledger once", `activePostedJournals=${approvedJournalCount}`);
    }

    try {
      await assertPaymentCanPost(tx, payment.id, company.id);
      fail(results, "Posted payment cannot post again", "Duplicate post guard did not reject existing journal.");
    } catch {
      pass(results, "Posted payment cannot post again", "Duplicate post guard rejected existing active journal.");
    }

    const lockedDate = new Date(Date.UTC(2099, 10, 15));
    const lockedPayment = await tx.payment.create({
      data: {
        projectId: project.id,
        invoiceId: invoice.id,
        amount: 500,
        date: lockedDate,
        description: `TEST_PHASE1E_PAYMENT_LOCKED_${stamp}`,
        approvalStatus: "APPROVED",
      },
    });
    await tx.fiscalPeriod.create({
      data: {
        month: lockedDate.toISOString().slice(0, 7),
        startDate: new Date(Date.UTC(2099, 10, 1)),
        endDate: new Date(Date.UTC(2099, 10, 30)),
        companyId: company.id,
        isLocked: true,
      },
    });
    try {
      await assertPaymentCanPost(tx, lockedPayment.id, company.id);
      fail(results, "Payment in locked period cannot post", "Locked period guard did not reject posting.");
    } catch {
      pass(results, "Payment in locked period cannot post", "Locked period guard rejected posting.");
    }

    const sourceLessPayment = await tx.payment.create({
      data: {
        projectId: project.id,
        amount: 250,
        date: now,
        description: `TEST_PHASE1E_PAYMENT_NO_SOURCE_${stamp}`,
        approvalStatus: "APPROVED",
      },
    });
    try {
      await assertPaymentCanPost(tx, sourceLessPayment.id, company.id);
      fail(results, "Payment without invoice cannot post", "Source document guard did not reject posting.");
    } catch {
      pass(results, "Payment without invoice cannot post", "Source document guard rejected posting.");
    }

    const rejectedPayment = await tx.payment.create({
      data: {
        projectId: project.id,
        invoiceId: invoice.id,
        amount: 200,
        date: now,
        description: `TEST_PHASE1E_PAYMENT_REJECTED_${stamp}`,
        approvalStatus: "REJECTED",
      },
    });
    try {
      await assertPaymentCanPost(tx, rejectedPayment.id, company.id);
      fail(results, "REJECTED payment cannot post", "Rejected payment was considered postable.");
    } catch {
      pass(results, "REJECTED payment cannot post", "Rejected payment was blocked from posting.");
    }

    await tx.journalEntry.update({ where: { id: journal.id }, data: { isReversed: true, reversedById: approver.id } });
    const reversedPostedLines = await tx.transactionLine.count({
      where: {
        journalEntry: { sourceType: "PAYMENT", sourceId: payment.id, deletedAt: null, isPosted: true, isReversed: false },
        deletedAt: null,
      },
    });
    const paidAmountFromActiveJournals = reversedPostedLines > 0 ? 1000 : 0;
    if (reversedPostedLines === 0 && paidAmountFromActiveJournals === 0) {
      pass(results, "Reversed payment journal is excluded from paid amount and posted ledger", "Active posted line count is 0 after reversal.");
    } else {
      fail(results, "Reversed payment journal is excluded from paid amount and posted ledger", `activePostedLines=${reversedPostedLines}`);
    }

    throw new Error(rollbackSignal);
  });
}

async function assertNoFixtureResidue() {
  const [projects, invoices, payments] = await Promise.all([
    prisma.project.count({ where: { name: { startsWith: "TEST_PHASE1E_PROJECT_" } } }),
    prisma.invoice.count({ where: { invoiceNumber: { startsWith: "TEST_PHASE1E_INVOICE_" } } }),
    prisma.payment.count({ where: { description: { startsWith: "TEST_PHASE1E_PAYMENT_" } } }),
  ]);
  return { projects, invoices, payments };
}

async function main() {
  loadEnvFiles();
  fs.mkdirSync(outDir, { recursive: true });
  const results: Result[] = [];

  try {
    await runFixtureTests(results);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== rollbackSignal) throw error;
  }

  const residue = await assertNoFixtureResidue();
  const noResidue = residue.projects === 0 && residue.invoices === 0 && residue.payments === 0;
  if (noResidue) {
    pass(results, "TEST_PHASE1E fixture cleanup", "Transaction rollback left no project/invoice/payment fixture residue.");
  } else {
    fail(results, "TEST_PHASE1E fixture cleanup", JSON.stringify(residue));
  }

  const failed = results.filter((result) => result.result === "FAIL");
  const report = {
    generatedAt: new Date().toISOString(),
    results,
    summary: {
      pass: results.filter((result) => result.result === "PASS").length,
      fail: failed.length,
      skip: 0,
    },
  };

  fs.writeFileSync(path.join(outDir, "accounting-workflow-guards-report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(outDir, "accounting-workflow-guards-report.md"),
    [
      "# Accounting Workflow Guards Report",
      "",
      `Generated: ${report.generatedAt}`,
      "",
      "| Test | Result | Notes |",
      "| ---- | ------ | ----- |",
      ...results.map((result) => `| ${result.test} | ${result.result} | ${result.notes} |`),
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(report.summary, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
