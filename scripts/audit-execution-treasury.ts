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
import { ProgressService } from "../services/progress.service";
import { RevenueService } from "../services/revenue.service";
import { TreasuryService } from "../services/finance/treasury.service";
import { ForecastEngineService } from "../services/finance/forecast-engine.service";
import crypto from "crypto";

async function runAudit() {
  console.log("\n================================================================================");
  console.log("     🚧 PHASES 6 & 7 FORENSIC AUDIT: PROGRESS CONTROL & PREDICTIVE TREASURY");
  console.log("================================================================================\n");

  const project = await prisma.project.findFirst({
    where: { name: 'Khu Đô Thị Thông Minh Vinhomes Ocean Park 3', deletedAt: null }
  });
  if (!project) throw new Error("Project not found.");

  // Ensure all required ledger accounts exist
  const accounts = [
    { code: '1310', name: 'Phải thu khách hàng', type: 'ASSET' as const },
    { code: '1368', name: 'Phải thu khác - Retention Receivable', type: 'ASSET' as const },
    { code: '5110', name: 'Doanh thu xây lắp', type: 'INCOME' as const },
    { code: '33311', name: 'Thuế GTGT đầu ra phải nộp', type: 'LIABILITY' as const },
    { code: '1010', name: 'Tiền mặt', type: 'ASSET' as const },
    { code: '3310', name: 'Phải trả người bán', type: 'LIABILITY' as const },
    { code: '3311', name: 'Phải trả người bán chưa có hóa đơn (GRNI)', type: 'LIABILITY' as const },
    { code: '6210', name: 'Chi phí nguyên vật liệu trực tiếp', type: 'EXPENSE' as const },
    { code: '1122', name: 'Tiền gửi ngoại tệ (USD)', type: 'ASSET' as const },
    { code: '5150', name: 'Doanh thu hoạt động tài chính', type: 'INCOME' as const },
    { code: '6350', name: 'Chi phí tài chính', type: 'EXPENSE' as const },
  ];
  for (const acc of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: acc
    });
  }

  const wbs = await prisma.wBSItem.findFirst({
    where: { projectId: project.id, code: 'WBS-01-01', deletedAt: null }
  });
  if (!wbs) throw new Error("WBS-01-01 not found.");

  // CLEANUP PREVIOUS AUDIT RUN DATA TO ENSURE ISOLATION
  await prisma.cashReservation.deleteMany({ where: { projectId: project.id } });
  await prisma.treasuryApproval.deleteMany({});
  await prisma.paymentBatch.deleteMany({});
  await prisma.bankTransaction.deleteMany({});
  await prisma.bankStatement.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.progressEntry.deleteMany({ where: { BOQItem: { wbsId: wbs.id } } });
  await prisma.invoice.updateMany({
    where: { wbsId: wbs.id },
    data: { deletedAt: new Date() }
  });
  await prisma.bOQItem.deleteMany({ where: { wbsId: wbs.id } });

  const pm = await prisma.user.findUnique({ where: { email: 'pm@hoabinhcorp.com' } });
  const cfo = await prisma.user.findUnique({ where: { email: 'cfo@hoabinhcorp.com' } });
  if (!pm || !cfo) throw new Error("Users not found.");

  // Pre-seed BOQ Item for Testing
  const boqItem = await prisma.bOQItem.create({
    data: {
      projectId: project.id,
      wbsId: wbs.id,
      description: "Thí nghiệm nén tĩnh cọc D800",
      unit: "Cọc",
      quantity: 10,
      unitRate: 150000000, // 150,000,000 VND
      totalAmount: 1500000000 // 1.5B VND
    }
  });

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

  console.log("--------------------------------------------------------------------------------");
  console.log("📝 TASK 1: CERTIFIED PROGRESS RULES (BOQ LIMITS & APPROVAL FLOW)");
  console.log("--------------------------------------------------------------------------------");

  let entry1: any, entry2: any;
  try {
    // 1. Create Progress Entry (PENDING)
    entry1 = await ProgressService.createProgressEntry({
      boqItemId: boqItem.id,
      quantity: 4,
      note: "Nghiệm thu cọc phân đoạn 1",
      createdById: pm.id
    });
    printResult("Create progress entry (PENDING)", entry1.status === "PENDING", `Entry created: ${entry1.id}`);

    // 2. Reject and check immutability
    const entryReject = await ProgressService.createProgressEntry({
      boqItemId: boqItem.id,
      quantity: 1,
      note: "Nghiệm thu lỗi mối hàn",
      createdById: pm.id
    });
    await ProgressService.rejectProgressEntry(entryReject.id, pm.id);
    printResult("Reject progress entry", true, "Entry rejected successfully.");

    try {
      await ProgressService.approveProgressEntry(entryReject.id, pm.id);
      printResult("Rejected entry immutability", false, "Allowed to approve a rejected entry");
    } catch (e: any) {
      printResult("Rejected entry immutability", e.message.includes("không thể phê duyệt"), e.message);
    }

    // 3. Prevent Over-Certification
    try {
      await ProgressService.createProgressEntry({
        boqItemId: boqItem.id,
        quantity: 8, // 4 (pending) + 8 = 12 > 10 (BOQ)
        note: "Cố tình nghiệm thu vượt BOQ",
        createdById: pm.id
      });
      printResult("Block Over-Certification", false, "Allowed certification > BOQ quantity");
    } catch (e: any) {
      printResult("Block Over-Certification", e.message.includes("vượt quá khối lượng BOQ"), e.message);
    }

    // 4. Approve progress
    await ProgressService.approveProgressEntry(entry1.id, pm.id);
    printResult("Approve progress entry", true, "Transitioned PENDING to APPROVED");
  } catch (err: any) {
    printResult("Progress Certification", false, err.message);
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("🧾 TASK 2: BILLING ELIGIBILITY & OVERBILLING PROTECTION");
  console.log("--------------------------------------------------------------------------------");

  if (entry1) {
    try {
      // 1. Attempt invoice within approved progress (4 units * 150M = 600M netAmount)
      const invSuccess = await RevenueService.createInvoice({
        projectId: project.id,
        wbsId: wbs.id,
        netAmount: 500000000, // 500M <= 600M
        issuedDate: new Date(),
        invoiceNumber: "INV-AUDIT-" + Date.now(),
        requestId: "req-inv-ok-" + Date.now()
      }, pm.id);
      printResult("Billing within certified limits", !!invSuccess.id, "Allowed billing backed by approved progress");

      // 2. Attempt overbilling (additional 200M, total 700M > 600M approved progress)
      try {
        await RevenueService.createInvoice({
          projectId: project.id,
          wbsId: wbs.id,
          netAmount: 200000000, // 500M + 200M = 700M > 600M
          issuedDate: new Date(),
          invoiceNumber: "INV-AUDIT-OVER-" + Date.now(),
          requestId: "req-inv-fail-" + Date.now()
        }, pm.id);
        printResult("Block Overbilling", false, "Allowed invoice netAmount > approved progress");
      } catch (e: any) {
        printResult("Block Overbilling", e.message.includes("vượt quá khối lượng dở dang nghiệm thu"), e.message);
      }
    } catch (err: any) {
      printResult("Billing Control Flow", false, err.message);
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("🏦 TASK 3: ADVANCED TREASURY & BANK RECONCILIATION");
  console.log("--------------------------------------------------------------------------------");

  try {
    // 1. Create Bank Account
    const bank = await TreasuryService.createBankAccount({
      bankName: "Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)",
      accountNumber: "VCB-1029384756",
      currency: "VND",
      initialBalance: 2000000000 // 2B VND
    });
    printResult("Create Bank Account", !!bank.id, `Created bank account: ${bank.accountNumber}`);

    // 2. Real Cash Position verification
    const cashPos = await TreasuryService.getRealCashPosition(bank.id);
    printResult("Real Cash Position (Available Cash)", cashPos.availableCash === 2000000000, `Available: ${cashPos.availableCash}`);

    // 3. Create Cash Reservation
    await TreasuryService.reserveCash(project.id, 500000000, "Bảo lãnh thực hiện hợp đồng");
    const cashPosAfterRes = await TreasuryService.getRealCashPosition(bank.id);
    printResult("Apply Cash Reservation", cashPosAfterRes.availableCash === 1500000000, `Available after reserve: ${cashPosAfterRes.availableCash}`);

    // 4. Payment Batch & Dual Approval
    const costRec1 = await prisma.costRecord.findFirst({ where: { projectId: project.id, status: "unpaid" } });
    if (costRec1) {
      const batch = await TreasuryService.createPaymentBatch(bank.id, "Đợt thanh toán thầu phụ móng", [costRec1.id], pm.id);
      printResult("Create Payment Batch", batch.status === "DRAFT", `Batch Total: ${batch.totalAmount}`);

      // Dual Approval Matrix
      await TreasuryService.approvePaymentBatch(batch.id, pm.id); // Go to PENDING
      const batchPending = await prisma.paymentBatch.findUnique({ where: { id: batch.id } });
      printResult("First Approval (Transition PENDING)", batchPending?.status === "PENDING", "Transitioned to PENDING");

      await TreasuryService.approvePaymentBatch(batch.id, cfo.id, true); // Go to COMPLETED
      const batchDone = await prisma.paymentBatch.findUnique({ where: { id: batch.id } });
      printResult("Second Approval (Transition COMPLETED)", batchDone?.status === "COMPLETED", "Payment run executed.");
    }

    // 5. FX Gain / Loss Test
    const inv = await prisma.invoice.findFirst({ where: { projectId: project.id } });
    if (inv) {
      await prisma.$transaction(async (tx) => {
        await TreasuryService.postFXTransaction(tx, {
          projectId: project.id,
          invoiceId: inv.id,
          paymentAmountUSD: 10000,
          invoiceRate: 25000,
          paymentRate: 25200 // FX Gain
        });
      });
      printResult("FX Gain Posting", true, "Posted FX Gain to Ledger Successfully.");
    }
  } catch (err: any) {
    printResult("Treasury Operations", false, err.message);
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("📈 TASK 4: FORECASTING ENGINE & RISK CORRELATION");
  console.log("--------------------------------------------------------------------------------");

  try {
    const runway = await ForecastEngineService.getLiquidityRunway(project.id);
    printResult("Liquidity Runway Calculation", runway.daysToInsolvency > 0, `Days to Insolvency: ${runway.daysToInsolvency} days`);

    const cashForecast = await ForecastEngineService.getRollingCashForecast(project.id);
    printResult("Rolling Cash Forecast (30/60/90 Days)", !!cashForecast.forecast30, `30 Days Net: ${cashForecast.forecast30.net} | 90 Days Net: ${cashForecast.forecast90.net}`);

    const riskCorrelation = await ForecastEngineService.getRiskCorrelation(project.id);
    printResult("Risk Correlation & Proactive Alerts", riskCorrelation.stressScore >= 0, `Stress Score: ${riskCorrelation.stressScore}, Level: ${riskCorrelation.level}`);
  } catch (err: any) {
    printResult("Forecasting & Risk Engine", false, err.message);
  }

  const total = testPassed + testFailed;
  console.log("\n================================================================================");
  console.log(`🎯 PHASES 6 & 7 AUDIT SUMMARY: ${testPassed}/${total} PASSED | ${testFailed} FAILED`);
  console.log(`   Success Rate: ${total > 0 ? Math.round(testPassed / total * 100) : 0}%`);
  console.log("================================================================================\n");
}

runAudit().catch(e => {
  console.error("Fatal Error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
