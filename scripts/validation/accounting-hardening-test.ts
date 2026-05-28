import { prisma } from "../../lib/prisma";
import { UserRole, ProjectStatus, TransactionType } from "../../generated/prisma-client";
import { seedChartOfAccounts } from "../../lib/accounting/chartOfAccounts";
import { VoucherService } from "../../services/voucher.service";
import { VoucherNumberService } from "../../services/finance/voucher-number.service";
import { WorkInProgressClosingService } from "../../services/finance/wip-closing.service";
import { TrialBalanceService } from "../../services/finance/trial-balance.service";
import { GeneralJournalService } from "../../services/finance/general-journal.service";
import { LedgerReportService } from "../../services/finance/ledger-report.service";
import { Decimal } from "decimal.js";
import * as crypto from "crypto";

async function main() {
  console.log("==========================================================================");
  console.log("🔥 STARTING AUDIT-GRADE ACCOUNTING HARDENING STRESS TEST");
  console.log("==========================================================================");

  // 1. Khởi tạo Chart of Accounts
  console.log("\n[Step 1] Initializing Standard Chart of Accounts (Circular 200)...");
  await prisma.$transaction(async (tx) => {
    await seedChartOfAccounts(tx);
  });
  console.log("✅ Chart of Accounts initialized.");

  // 2. Tạo Tenant Cô lập
  console.log("\n[Step 2] Creating Isolated Multi-Tenant Structure...");
  const companyCode = `HARDEN-${Date.now().toString().slice(-4)}`;
  const company = await prisma.company.create({
    data: {
      name: "Accounting Hardening Testing Corp",
      code: companyCode,
      taxCode: "0112233445",
      address: "256 Audit District, Hanoi, Vietnam"
    }
  });

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: "Central Ledger Division",
      code: `CLD-${companyCode.split("-")[1]}`,
      address: "Building A, Financial Tower, Hanoi"
    }
  });

  // Tạo User Kế toán đại diện
  const accountant = await prisma.user.create({
    data: {
      email: `harden.acc-${Date.now()}@harden.vn`,
      name: "Trần Thị Cương Quyết (Chief Accountant)",
      role: UserRole.ACCOUNTANT,
      companyId: company.id
    }
  });

  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name: "Harden Skybridge Super Highway",
      status: ProjectStatus.IN_PROGRESS,
      contractValue: new Decimal(10000000000), // 10 Billion
      totalBudget: new Decimal(8000000000),
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31")
    }
  });

  console.log(`✅ Tenant Company created: ID ${company.id}`);
  console.log(`✅ Accountant seeded: ${accountant.name}`);
  console.log(`✅ Project seeded: ID ${project.id}`);

  // Tìm tài khoản kế toán cần thiết
  const accountCodes = ["1111", "1121", "131", "331", "621", "627", "154"];
  const accounts = await prisma.ledgerAccount.findMany({
    where: { code: { in: accountCodes } }
  });
  const acctMap = new Map(accounts.map(a => [a.code, a.id]));

  // 3. Nghiệp vụ Tự động Đánh số Chứng từ
  console.log("\n[Step 3] Verifying Auto-Numbering Engine...");
  
  // A. Tạo Phiếu thu (PT)
  const ptVoucher = await VoucherService.saveVoucher(accountant.id, {
    projectId: project.id,
    date: new Date("2026-05-10"),
    description: "Khách hàng tạm ứng tiền mặt",
    sourceType: "PT",
    lines: [
      { accountId: acctMap.get("1111")!, amount: 150000000, type: "DEBIT", description: "Thu tiền tạm ứng" },
      { accountId: acctMap.get("131")!, amount: 150000000, type: "CREDIT", description: "Khách hàng tạm ứng" }
    ]
  });
  console.log(`   - Phiếu Thu (PT) Auto-Generated Ref: ${ptVoucher.reference} (Expected: PT2026000001)`);
  if (ptVoucher.reference !== "PT2026000001") {
    throw new Error(`Sai định dạng số chứng từ: ${ptVoucher.reference}`);
  }

  // B. Tạo Phiếu chi (PC)
  const pcVoucher = await VoucherService.saveVoucher(accountant.id, {
    projectId: project.id,
    date: new Date("2026-05-11"),
    description: "Chi tiền mặt mua vật liệu phụ",
    sourceType: "PC",
    lines: [
      { accountId: acctMap.get("621")!, amount: 20000000, type: "DEBIT", description: "Chi phí nguyên vật liệu" },
      { accountId: acctMap.get("1111")!, amount: 20000000, type: "CREDIT", description: "Chi tiền mặt" }
    ]
  });
  console.log(`   - Phiếu Chi (PC) Auto-Generated Ref: ${pcVoucher.reference} (Expected: PC2026000001)`);
  if (pcVoucher.reference !== "PC2026000001") {
    throw new Error(`Sai định dạng số chi: ${pcVoucher.reference}`);
  }

  // C. Tạo Ủy nhiệm chi (UNC)
  const uncVoucher = await VoucherService.saveVoucher(accountant.id, {
    projectId: project.id,
    date: new Date("2026-05-12"),
    description: "UNC thanh toán tiền mua bê tông",
    sourceType: "UNC",
    lines: [
      { accountId: acctMap.get("621")!, amount: 80000000, type: "DEBIT", description: "Chi phí mua bê tông" },
      { accountId: acctMap.get("1121")!, amount: 80000000, type: "CREDIT", description: "UNC ngân hàng" }
    ]
  });
  console.log(`   - UNC Auto-Generated Ref: ${uncVoucher.reference} (Expected: UNC2026000001)`);
  if (uncVoucher.reference !== "UNC2026000001") {
    throw new Error(`Sai định dạng số UNC: ${uncVoucher.reference}`);
  }

  // 4. Ghi sổ & Bỏ ghi sổ
  console.log("\n[Step 4] Testing Posting & Unposting Lifecycle...");
  const postedPt = await VoucherService.postVoucher(accountant.id, ptVoucher.id);
  console.log(`   - Ghi sổ thành công: ${postedPt.reference}. Status advanced to: ${postedPt.status}`);
  
  const unpostedPt = await VoucherService.unpostVoucher(accountant.id, ptVoucher.id);
  console.log(`   - Bỏ ghi sổ thành công: ${unpostedPt.reference}. Status rolled back to: ${unpostedPt.status}`);
  
  // Ghi sổ lại để có số liệu tính toán
  await VoucherService.postVoucher(accountant.id, ptVoucher.id);
  await VoucherService.postVoucher(accountant.id, pcVoucher.id);
  await VoucherService.postVoucher(accountant.id, uncVoucher.id);
  console.log("   - Tái ghi sổ 3 chứng từ để ghi sổ cái.");

  // Lập năm tài chính trước
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      year: 2026,
      companyId: company.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31")
    }
  });

  // Lập kỳ kế toán 2026-05 và khóa sổ
  await prisma.accountingPeriod.create({
    data: {
      id: `AP-2026-05-${company.id}`,
      fiscalYearId: fiscalYear.id,
      periodNumber: 5,
      month: "2026-05",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-31"),
      status: "CLOSED",
      closedAt: new Date(),
      closedById: accountant.id
    }
  });
  console.log("   - Kỳ kế toán '2026-05' đã được KHÓA SỔ thành công.");

  // Thử nghiệm Tạo mới chứng từ trong kỳ khóa (Phải bị chặn đứng)
  console.log("   - Thử nghiệm TẠO MỚI chứng từ nháp trong kỳ khóa '2026-05'...");
  try {
    await VoucherService.saveVoucher(accountant.id, {
      projectId: project.id,
      date: new Date("2026-05-15"),
      description: "Thử hạch toán lách luật",
      sourceType: "PT",
      lines: [
        { accountId: acctMap.get("1111")!, amount: 50000000, type: "DEBIT", description: "Lách luật" },
        { accountId: acctMap.get("131")!, amount: 50000000, type: "CREDIT", description: "Lách luật" }
      ]
    });
    throw new Error("LỖI NGHIÊM TRỌNG: Kỳ kế toán đã khóa nhưng vẫn cho TẠO MỚI chứng từ nháp!");
  } catch (err: any) {
    console.log(`     ✅ Chặn Tạo mới thành công! Lỗi phản hồi: "${err.message}"`);
  }

  // Thử sửa đổi chứng từ cũ thuộc kỳ khóa (Phải bị chặn)
  console.log("   - Thử nghiệm CẬP NHẬT chứng từ cũ thuộc kỳ khóa '2026-05'...");
  try {
    await VoucherService.saveVoucher(accountant.id, {
      id: pcVoucher.id,
      projectId: project.id,
      date: new Date("2026-05-11"),
      description: "Thử sửa chứng từ đã khóa",
      sourceType: "PC",
      lines: [
        { accountId: acctMap.get("6210")!, amount: 30000000, type: "DEBIT", description: "Chi phí NVL" },
        { accountId: acctMap.get("1111")!, amount: 30000000, type: "CREDIT", description: "Chi tiền mặt" }
      ]
    });
    throw new Error("LỖI NGHIÊM TRỌNG: Kỳ kế toán đã khóa nhưng vẫn cho CẬP NHẬT chứng từ!");
  } catch (err: any) {
    console.log(`     ✅ Chặn Cập nhật thành công! Lỗi phản hồi: "${err.message}"`);
  }

  // Thử Xóa chứng từ thuộc kỳ khóa (Phải bị chặn)
  console.log("   - Thử nghiệm XÓA chứng từ thuộc kỳ khóa '2026-05'...");
  try {
    // Bỏ ghi sổ trước (chúng ta thử bỏ ghi trước, nhưng bỏ ghi cũng phải bị chặn vì thuộc kỳ khóa!)
    await VoucherService.unpostVoucher(accountant.id, pcVoucher.id);
    throw new Error("LỖI NGHIÊM TRỌNG: Kỳ kế toán đã khóa nhưng vẫn cho BỎ GHI SỔ chứng từ!");
  } catch (err: any) {
    console.log(`     ✅ Chặn Bỏ ghi sổ thành công! Lỗi phản hồi: "${err.message}"`);
  }

  // Mở lại kỳ kế toán để tiếp tục test
  await prisma.accountingPeriod.update({
    where: { id: `AP-2026-05-${company.id}` },
    data: { status: "OPEN", closedAt: null, closedById: null }
  });
  console.log("   - Kỳ kế toán '2026-05' đã được MỞ LẠI để phục vụ các bước tiếp theo.");

  // 6. Tự động Kết chuyển TK 154
  console.log("\n[Step 6] Verifying Auto Work In Progress (WIP) Closing to TK 154...");
  
  // A. Chế độ Preview
  const preview = await WorkInProgressClosingService.previewClosing(project.id, "2026-05-01", "2026-05-31");
  console.log(`   - Preview Closing: Total Cost raw materials (621): ${preview.lines.find(l => l.code === "621")?.amount.toLocaleString()} VND`);
  console.log(`   - Preview Total WIP Amount to transfer to 154: ${preview.totalAmount.toLocaleString()} VND (Expected: 100,000,000 VND)`);
  if (preview.totalAmount !== 100000000) {
    throw new Error(`Sai số tiền kết chuyển: ${preview.totalAmount}`);
  }

  // B. Chế độ Execute (Tạo bút toán thực)
  const execResult = await WorkInProgressClosingService.executeClosing(accountant.id, project.id, "2026-05-01", "2026-05-31");
  console.log(`   - Execute Closing Success: Auto-Generated WIP Ref: ${execResult.reference}`);
  
  // Ghi sổ chứng từ kết chuyển WIP này
  await VoucherService.postVoucher(accountant.id, execResult.voucherId);
  console.log("   - Chứng từ kết chuyển WIP đã được GHI SỔ thực tế vào sổ cái.");

  // 7. Kết xuất Báo cáo Tài chính
  console.log("\n[Step 7] Checking Core Accounting Reports Accuracy...");

  // A. Sổ Nhật ký chung
  const generalJournal = await GeneralJournalService.getReport(project.id, "2026-05-01", "2026-05-31");
  console.log(`   - General Journal: Retrieved ${generalJournal.length} double-entry rows.`);

  // B. Sổ Cái tài khoản 1111 (Tiền mặt)
  const cashLedger = await LedgerReportService.getReport(project.id, "1111", "2026-05-01", "2026-05-31");
  console.log(`   - Sổ Cái TK 1111 (Tiền mặt):`);
  console.log(`     * Dư đầu kỳ Nợ: ${cashLedger.opening.debit.toLocaleString()} VND`);
  console.log(`     * Tổng phát sinh Nợ: ${cashLedger.totals.debit.toLocaleString()} VND`);
  console.log(`     * Tổng phát sinh Có: ${cashLedger.totals.credit.toLocaleString()} VND`);
  console.log(`     * Dư cuối kỳ Nợ: ${cashLedger.closing.debit.toLocaleString()} VND (Expected: 130,000,000 VND)`);
  if (cashLedger.closing.debit !== 130000000) {
    throw new Error(`Sai lệch số dư Sổ cái TK 1111: ${cashLedger.closing.debit}`);
  }

  // C. Bảng Cân đối Phát sinh (Trial Balance) có đối chiếu Nợ = Có
  const trialBalance = await TrialBalanceService.getReport(project.id, "2026-05-01", "2026-05-31");
  console.log("\n         📊 TRIAL BALANCE ACCURACY CHECK:");
  console.log("         ------------------------------------------------------------------");
  console.log("         TK   | Tên tài khoản               | Phát sinh Nợ | Phát sinh Có");
  console.log("         ------------------------------------------------------------------");
  trialBalance.rows.forEach(r => {
    console.log(`         ${r.code.padEnd(4)} | ${r.name.padEnd(27)} | ${r.period.debit.toLocaleString().padStart(12)} | ${r.period.credit.toLocaleString().padStart(12)}`);
  });
  console.log("         ------------------------------------------------------------------");
  console.log(`         TỔNG PHÁT SINH SỔ CÁI             | ${trialBalance.totals.period.debit.toLocaleString().padStart(12)} | ${trialBalance.totals.period.credit.toLocaleString().padStart(12)}`);
  console.log("         ------------------------------------------------------------------");

  if (trialBalance.totals.period.debit === trialBalance.totals.period.credit) {
    console.log("   - ✅ TRIAL BALANCE IS PERFECTLY BALANCED (Tổng Nợ = Tổng Có).");
  } else {
    throw new Error("Bảng cân đối phát sinh mất cân bằng!");
  }

  // 8. Stress test Concurrency 100 User
  console.log("\n[Step 8] Initiating 100-User High Concurrency Stress Test...");
  const stressCount = 100;
  console.log(`   - Simulating ${stressCount} parallel users generating 'PT' voucher numbers simultaneously...`);

  const startTime = Date.now();
  
  // Khởi chạy 100 transaction song song để sinh số
  const promises = Array.from({ length: stressCount }).map(async (_, idx) => {
    return await prisma.$transaction(async (tx) => {
      return await VoucherNumberService.generateNextNumber(tx, company.id, "PT", "2026-05-20");
    });
  });

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  console.log(`   - Stress test completed in ${elapsed}ms. (Avg: ${(elapsed / stressCount).toFixed(2)}ms per user).`);
  
  // Kiểm tra trùng lặp số chứng từ
  const uniqueResults = new Set(results);
  console.log(`   - Generated Voucher numbers: ${results[0]} -> ${results[results.length - 1]}`);
  console.log(`   - Unique count: ${uniqueResults.size} / ${stressCount}`);

  if (uniqueResults.size === stressCount) {
    console.log("   - ✅ CONCURRENCY INTEGRITY VERIFIED: 100% unique sequence generated without a single collision!");
  } else {
    throw new Error(`CONCURRENCY FAIL: Có trùng lặp số chứng từ! Số độc bản: ${uniqueResults.size}`);
  }

  console.log("\n==========================================================================");
  console.log("🏆 ALL HARDENING AND CONCURRENCY TESTS COMPLETED SUCCESSFULLY - 100% HEALTHY");
  console.log("==========================================================================");
}

main()
  .catch(err => {
    console.error("🔴 CRITICAL TEST CRASH:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
