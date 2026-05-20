import * as fs from 'fs';
import * as path from 'path';

function loadEnvFiles() {
  const envLocal = path.join(process.cwd(), '.env.local');
  const envBase = path.join(process.cwd(), '.env');
  const parse = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const k = trimmed.substring(0, idx).trim();
      let v = trimmed.substring(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[k] = v;
    });
  };
  parse(envLocal);
  parse(envBase);
}
loadEnvFiles();

import { prisma } from "../lib/prisma";
import { RevenueService } from "../services/revenue.service";

async function runAudit() {
  console.log("\n================================================================================");
  console.log("            🔍 PHASE 3 FORENSIC AUDIT: REVENUE & BILLING HARDENING");
  console.log("================================================================================\n");

  const project = await prisma.project.findFirst({
    where: { name: 'Khu Đô Thị Thông Minh Vinhomes Ocean Park 3', deletedAt: null }
  });
  if (!project) throw new Error("Vinhomes Ocean Park 3 project not found.");

  const wbs = await prisma.wBSItem.findFirst({
    where: { projectId: project.id, code: 'WBS-01-01', deletedAt: null }
  });
  if (!wbs) throw new Error("WBS-01-01 not found.");

  const pm = await prisma.user.findUnique({ where: { email: 'pm@hoabinhcorp.com' } });
  const accountant = await prisma.user.findUnique({ where: { email: 'accountant@hoabinhcorp.com' } });
  if (!pm || !accountant) throw new Error("Users not found.");

  // Ensure fiscal period is open
  await prisma.fiscalPeriod.upsert({
    where: { month: "2026-05" },
    update: { isLocked: false, lockedAt: null, lockedById: null },
    create: { month: "2026-05", isLocked: false, companyId: project.companyId }
  });

  // Ensure all required ledger accounts exist
  const accounts = [
    { code: '1310', name: 'Phải thu khách hàng', type: 'ASSET' as const },
    { code: '1368', name: 'Phải thu khác - Retention Receivable', type: 'ASSET' as const },
    { code: '5110', name: 'Doanh thu xây lắp', type: 'INCOME' as const },
    { code: '33311', name: 'Thuế GTGT đầu ra phải nộp', type: 'LIABILITY' as const },
    { code: '1010', name: 'Tiền mặt', type: 'ASSET' as const },
  ];
  for (const acc of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: acc
    });
  }

  console.log(`🏢 Project: ${project.name}`);
  console.log(`🛣️  WBS: ${wbs.code} - ${wbs.name}`);
  console.log(`👤 PM: ${pm.name} | Accountant: ${accountant.name}\n`);

  let testPassed = 0;
  let testFailed = 0;

  function printResult(testName: string, passed: boolean, message: string) {
    if (passed) {
      testPassed++;
      console.log(`✅ [PASS] ${testName}: ${message}`);
    } else {
      testFailed++;
      console.log(`❌ [FAIL] ${testName}: ${message}`);
    }
  }

  // ============================================================================
  // TASK 1: Invoice Calculation Verification
  // DB constraints:
  //   amount = netAmount + vatAmount
  //   remainingAmount = amount - paidAmount
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("🛠️  TASK 1: BILLING & MILESTONE INVOICE CALCULATION VERIFICATION");
  console.log("--------------------------------------------------------------------------------");

  const netAmount = 5000000000; // 5B VND
  const vatRate = 10;
  const retentionRate = 5;
  const requestId = "audit-rev-" + Date.now();

  let invoice: any;
  try {
    invoice = await RevenueService.createInvoice({
      projectId: project.id,
      wbsId: wbs.id,
      invoiceNumber: "INV-AUDIT-" + Date.now(),
      amount: netAmount,
      netAmount: netAmount,
      vatRate: vatRate,
      retentionRate: retentionRate,
      note: "Hóa đơn thanh toán khối lượng đợt 1 - Audit test",
      issuedDate: new Date("2026-05-15"),
      createdById: pm.id,
      requestId
    }, pm.id);

    const expectedVatAmount = netAmount * vatRate / 100;        // 500M
    const expectedGrossAmount = netAmount + expectedVatAmount;   // 5.5B
    const expectedRetention = expectedGrossAmount * retentionRate / 100; // 275M

    const vatOk = Math.abs(Number(invoice.vatAmount) - expectedVatAmount) <= 1;
    const amountOk = Math.abs(Number(invoice.amount) - expectedGrossAmount) <= 1;
    const retentionOk = Math.abs(Number(invoice.retentionAmount) - expectedRetention) <= 1;
    const remainingOk = Math.abs(Number(invoice.remainingAmount) - expectedGrossAmount) <= 1;

    printResult("VAT Calculation", vatOk,
      `Expected: ${expectedVatAmount}, Got: ${invoice.vatAmount}`);
    printResult("Gross Amount (amount = net + VAT)", amountOk,
      `Expected: ${expectedGrossAmount}, Got: ${invoice.amount}`);
    printResult("Retention Calculation", retentionOk,
      `Expected: ${expectedRetention}, Got: ${invoice.retentionAmount}`);
    printResult("Remaining Amount consistency", remainingOk,
      `Expected: ${expectedGrossAmount}, Got: ${invoice.remainingAmount}`);

  } catch (err: any) {
    printResult("Invoice Creation", false, `Error: ${err.message}`);
  }

  // ============================================================================
  // TASK 2: Idempotency
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🛡️  TASK 2: INVOICE IDEMPOTENCY DEDUPLICATION");
  console.log("--------------------------------------------------------------------------------");

  if (invoice) {
    try {
      const dup = await RevenueService.createInvoice({
        projectId: project.id,
        wbsId: wbs.id,
        invoiceNumber: "INV-AUDIT-DUP",
        amount: netAmount,
        netAmount: netAmount,
        vatRate: vatRate,
        retentionRate: retentionRate,
        note: "Duplicate test",
        issuedDate: new Date("2026-05-15"),
        createdById: pm.id,
        requestId // same requestId
      }, pm.id);

      printResult("Invoice Idempotency", dup.id === invoice.id,
        `Same requestId returned same ID: ${dup.id === invoice.id}`);
    } catch (err: any) {
      printResult("Invoice Idempotency", false, `Error: ${err.message}`);
    }
  }

  // ============================================================================
  // TASK 3: Approval & Ledger Posting (Split Entries)
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📒 TASK 3: APPROVAL & SPLIT LEDGER POSTING (AR, Revenue, VAT, Retention)");
  console.log("--------------------------------------------------------------------------------");

  if (invoice) {
    try {
      await RevenueService.updateInvoiceApproval(invoice.id, "APPROVED", accountant.id);

      const journalEntry = await prisma.journalEntry.findFirst({
        where: { sourceId: invoice.id, sourceType: "INVOICE", isReversed: false },
        include: { lines: { include: { account: true } } }
      });

      if (!journalEntry) {
        printResult("Journal Entry Created", false, "No journal entry found after approval.");
      } else {
        const debits = journalEntry.lines
          .filter((l: any) => l.type === 'DEBIT')
          .reduce((s: number, l: any) => s + Number(l.amount), 0);
        const credits = journalEntry.lines
          .filter((l: any) => l.type === 'CREDIT')
          .reduce((s: number, l: any) => s + Number(l.amount), 0);
        const balanced = Math.abs(debits - credits) <= 1;

        printResult("Double-Entry Balance (Debit = Credit)", balanced,
          `Debit: ${debits.toLocaleString()} ₫ | Credit: ${credits.toLocaleString()} ₫`);

        // Check specific accounts
        const hasAR = journalEntry.lines.some((l: any) => l.type === 'DEBIT' && l.account.code === '1310');
        const hasRetention = journalEntry.lines.some((l: any) => l.type === 'DEBIT' && l.account.code === '1368');
        const hasRevenue = journalEntry.lines.some((l: any) => l.type === 'CREDIT' && l.account.code === '5110');
        const hasVAT = journalEntry.lines.some((l: any) => l.type === 'CREDIT' && l.account.code === '33311');

        printResult("Debit TK 1310 (AR)", hasAR, `AR posted: ${hasAR}`);
        printResult("Debit TK 1368 (Retention Receivable)", hasRetention, `Retention posted: ${hasRetention}`);
        printResult("Credit TK 5110 (Revenue)", hasRevenue, `Revenue posted: ${hasRevenue}`);
        printResult("Credit TK 33311 (VAT Output)", hasVAT, `VAT Output posted: ${hasVAT}`);

        // Verify amounts
        const arLine = journalEntry.lines.find((l: any) => l.type === 'DEBIT' && l.account.code === '1310');
        const retLine = journalEntry.lines.find((l: any) => l.type === 'DEBIT' && l.account.code === '1368');
        const revLine = journalEntry.lines.find((l: any) => l.type === 'CREDIT' && l.account.code === '5110');
        const vatLine = journalEntry.lines.find((l: any) => l.type === 'CREDIT' && l.account.code === '33311');

        if (arLine && retLine && revLine && vatLine) {
          console.log(`\n   📊 Journal Line Details:`);
          console.log(`      Debit  TK 1310 (AR):        ${Number(arLine.amount).toLocaleString()} ₫`);
          console.log(`      Debit  TK 1368 (Retention):  ${Number(retLine.amount).toLocaleString()} ₫`);
          console.log(`      Credit TK 5110 (Revenue):    ${Number(revLine.amount).toLocaleString()} ₫`);
          console.log(`      Credit TK 33311 (VAT):       ${Number(vatLine.amount).toLocaleString()} ₫`);
        }
      }
    } catch (err: any) {
      printResult("Approval & Ledger Posting", false, `Error: ${err.message}`);
    }
  }

  // ============================================================================
  // TASK 4: Payment & Collection
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("💰 TASK 4: PARTIAL PAYMENT & REMAINING AMOUNT TRACKING");
  console.log("--------------------------------------------------------------------------------");

  if (invoice) {
    try {
      const paymentAmount = 2000000000; // 2B partial payment
      const payment = await RevenueService.createPayment({
        invoiceId: invoice.id,
        amount: paymentAmount,
        date: new Date("2026-05-18"),
        description: "Thanh toán đợt 1 - Audit test",
        requestId: "audit-pay-" + Date.now()
      }, pm.id);

      printResult("Payment Created", !!payment.id,
        `Payment ID: ${payment.id}, Amount: ${Number(payment.amount).toLocaleString()} ₫`);

      // Verify invoice updated
      const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
      if (updatedInvoice) {
        const expectedRemaining = Number(updatedInvoice.amount) - Number(updatedInvoice.paidAmount);
        const remainingOk = Math.abs(Number(updatedInvoice.remainingAmount) - expectedRemaining) <= 1;

        printResult("Invoice Paid Amount Updated", Number(updatedInvoice.paidAmount) === paymentAmount,
          `Paid: ${Number(updatedInvoice.paidAmount).toLocaleString()} ₫`);
        printResult("Invoice Remaining Consistent", remainingOk,
          `Remaining: ${Number(updatedInvoice.remainingAmount).toLocaleString()} ₫ (expected: ${expectedRemaining.toLocaleString()} ₫)`);
        printResult("Invoice Status = PARTIAL", updatedInvoice.status === "PARTIAL",
          `Status: ${updatedInvoice.status}`);
      }

      // Verify payment journal entry
      const payJE = await prisma.journalEntry.findFirst({
        where: { sourceId: payment.id, sourceType: "PAYMENT", isReversed: false },
        include: { lines: { include: { account: true } } }
      });

      if (payJE) {
        const hasCashDebit = payJE.lines.some((l: any) => l.type === 'DEBIT' && l.account.code === '1010');
        const hasARCredit = payJE.lines.some((l: any) => l.type === 'CREDIT' && l.account.code === '1310');
        printResult("Payment Journal: Debit TK 1010 (Cash)", hasCashDebit, `Cash debited: ${hasCashDebit}`);
        printResult("Payment Journal: Credit TK 1310 (AR)", hasARCredit, `AR credited: ${hasARCredit}`);
      }
    } catch (err: any) {
      printResult("Payment Processing", false, `Error: ${err.message}`);
    }
  }

  // ============================================================================
  // TASK 5: Soft Delete & Journal Reversal
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🗑️  TASK 5: INVOICE SOFT DELETE & IMMUTABLE JOURNAL REVERSAL");
  console.log("--------------------------------------------------------------------------------");

  if (invoice) {
    try {
      await RevenueService.deleteInvoice(invoice.id, accountant.id, "Audit test - testing cancellation flow");

      const deleted = await prisma.$queryRawUnsafe(
        `SELECT "deletedAt" FROM "Invoice" WHERE id = $1`, invoice.id
      ) as any[];
      printResult("Soft Delete Applied", deleted[0]?.deletedAt !== null,
        `deletedAt: ${deleted[0]?.deletedAt}`);

      // Check reversal entries exist
      const reversals = await prisma.journalEntry.findMany({
        where: { sourceId: invoice.id, sourceType: "INVOICE", isReversed: true }
      });
      printResult("Original Journal Marked Reversed", reversals.length > 0,
        `Found ${reversals.length} reversed entry`);

    } catch (err: any) {
      printResult("Invoice Delete & Reversal", false, `Error: ${err.message}`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  const total = testPassed + testFailed;
  console.log("\n================================================================================");
  console.log(`🎯 PHASE 3 AUDIT SUMMARY: ${testPassed}/${total} PASSED | ${testFailed} FAILED`);
  console.log(`   Success Rate: ${total > 0 ? Math.round(testPassed / total * 100) : 0}%`);
  console.log("================================================================================\n");
}

runAudit().catch(e => {
  console.error("Fatal Error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
