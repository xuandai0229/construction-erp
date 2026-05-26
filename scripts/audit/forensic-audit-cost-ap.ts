import * as fs from 'fs';
import * as path from 'path';

// Automatically load Next.js environment files for standalone CLI execution
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
import { CostService } from "../services/cost.service";
import { Decimal } from "../generated/prisma-client/runtime/library";

async function runAudit() {
  console.log("\n================================================================================");
  console.log("            🔍 SYSTEM FORENSIC AUDIT: COST & AP/AR HARDENING VERIFICATION");
  console.log("================================================================================\n");

  // 1. Setup Context & Fetch Seeded Data
  const project = await prisma.project.findFirst({
    where: { name: 'Khu Đô Thị Thông Minh Vinhomes Ocean Park 3', deletedAt: null }
  });

  if (!project) {
    throw new Error("❌ Pre-requisite error: Vinhomes Ocean Park 3 project not found. Run validation:database first.");
  }

  const wbs = await prisma.wBSItem.findFirst({
    where: { projectId: project.id, code: 'WBS-01-01', deletedAt: null }
  });

  if (!wbs) {
    throw new Error("❌ Pre-requisite error: WBS-01-01 road infrastructure item not found.");
  }

  // Load Seeded Users
  const pm = await prisma.user.findUnique({ where: { email: 'pm@hoabinhcorp.com' } });
  const accountant = await prisma.user.findUnique({ where: { email: 'accountant@hoabinhcorp.com' } });
  const cfo = await prisma.user.findUnique({ where: { email: 'cfo@hoabinhcorp.com' } });

  if (!pm || !accountant || !cfo) {
    throw new Error("❌ Pre-requisite error: Seeded users pm, accountant, or cfo not found.");
  }

  // Pre-audit check: ensure active period 2026-05 is unlocked
  await prisma.fiscalPeriod.upsert({
    where: { month: "2026-05" },
    update: { isLocked: false, lockedAt: null, lockedById: null },
    create: { month: "2026-05", isLocked: false, companyId: project.companyId }
  });
  console.log("🔓 Pre-audit initialization: Fiscal Period 2026-05 forced UNLOCKED.\n");

  console.log(`🏢 Active Project: ${project.name}`);
  console.log(`🛣️  Active WBS: ${wbs.code} - ${wbs.name}`);
  console.log(`👤 Seeded Roles Loaded:`);
  console.log(`   - PM (MANAGER): ${pm.name} (ID: ${pm.id})`);
  console.log(`   - Accountant: ${accountant.name} (ID: ${accountant.id})`);
  console.log(`   - CFO: ${cfo.name} (ID: ${cfo.id})\n`);

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

  // --------------------------------------------------------------------------------
  // AUDIT TASK 1: IDEMPOTENCY DEDUPLICATION PROOF
  // --------------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("🛠️  AUDIT TASK 1: IDEMPOTENCY DEDUPLICATION PROOF");
  console.log("--------------------------------------------------------------------------------");

  const requestId = "audit-idempotency-" + Date.now();
  const costPayload = {
    projectId: project.id,
    wbsId: wbs.id,
    costType: "material" as const,
    amount: 15000000, // 15 million VND
    requestId,
    note: "Chi phí mua thép ống Hòa Phát đợt 3",
    date: new Date("2026-05-12"),
    supplier: "Công ty Cổ phần Thép Hòa Phát",
    status: "unpaid" as const,
    createdById: pm.id
  };

  try {
    // Attempt 1
    const cost1 = await CostService.create(costPayload, { userId: pm.id });
    
    // Attempt 2 (Sequential)
    const cost2 = await CostService.create(costPayload, { userId: pm.id });

    // Both should succeed but return the EXACT SAME database ID (meaning no duplicate row)
    const identicalIds = cost1.id === cost2.id;
    const dbCount = await prisma.costRecord.count({ where: { requestId } });

    printResult(
      "Idempotency Sequential Test",
      identicalIds && dbCount === 1,
      `Returned identical database ID (${cost1.id}) and created exactly ${dbCount} record.`
    );
  } catch (err: any) {
    printResult("Idempotency Sequential Test", false, `Error thrown: ${err.message}`);
  }

  // --------------------------------------------------------------------------------
  // AUDIT TASK 2: SEGREGATION OF DUTIES & FINANCIAL LIMITS AUDIT
  // --------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🛡️  AUDIT TASK 2: SEGREGATION OF DUTIES & FINANCIAL LIMITS");
  console.log("--------------------------------------------------------------------------------");

  const largeCostPayload = {
    projectId: project.id,
    wbsId: wbs.id,
    costType: "material" as const,
    amount: 150000000, // 150 million VND (> 100 million limit for PM)
    requestId: "audit-limit-" + Date.now(),
    note: "Chi phí cát xây lấp đợt 2",
    date: new Date("2026-05-12"),
    supplier: "Công ty Vật liệu Xây dựng Miền Nam",
    status: "unpaid" as const,
    createdById: pm.id
  };

  let largeCost: any;
  try {
    largeCost = await CostService.create(largeCostPayload, { userId: pm.id });
    printResult("Create 150M cost record", true, `Successfully created draft with ID ${largeCost.id}`);
  } catch (err: any) {
    printResult("Create 150M cost record", false, `Failed: ${err.message}`);
  }

  // Attempt 2.1: Segregation of Duties (PM attempts to approve their own created cost)
  if (largeCost) {
    try {
      await CostService.transition(largeCost.id, "APPROVED", { userId: pm.id });
      printResult("Segregation of Duties (SoD)", false, "System failed to block PM from approving their own document.");
    } catch (err: any) {
      const isSodBlocked = err.message.includes("Segregation of Duties") || err.message.includes("Người tạo chứng từ");
      printResult(
        "Segregation of Duties (SoD)",
        isSodBlocked,
        `Blocked PM from self-approving. Internal exception: "${err.message}"`
      );
    }
  }

  // Transition largeCost to PENDING_FINANCE so it can be audited for Accountant approval block
  if (largeCost) {
    try {
      await CostService.transition(largeCost.id, "PENDING_FINANCE", { userId: pm.id });
    } catch (err: any) {
      console.error(`Failed to submit largeCost to PENDING_FINANCE: ${err.message}`);
    }
  }

  // Attempt 2.3: Accountant Role Permission Check (Accountant attempts to approve PENDING_FINANCE cost)
  if (largeCost) {
    try {
      await CostService.transition(largeCost.id, "APPROVED", { userId: accountant.id });
      printResult("RBAC Approval Authorization (Accountant)", false, "System allowed Accountant to perform approval.");
    } catch (err: any) {
      const isRbacBlocked = err.message.includes("Quyền hạn tối thiểu") || err.message.includes("không được phép thực hiện");
      printResult(
        "RBAC Approval Authorization (Accountant)",
        isRbacBlocked,
        `Blocked Accountant from approving. Internal exception: "${err.message}"`
      );
    }
  }

  // Create a separate cost record by accountant to test PM's financial limit
  const separateCostPayload = {
    projectId: project.id,
    wbsId: wbs.id,
    costType: "material" as const,
    amount: 150000000, // 150 million VND (> 100 million limit for PM)
    requestId: "audit-pm-limit-" + Date.now(),
    note: "Mua cát san lấp do Accountant tạo",
    date: new Date("2026-05-12"),
    supplier: "Công ty Cổ phần Đầu tư Cát",
    status: "unpaid" as const,
    createdById: accountant.id
  };

  let separateCost: any;
  try {
    separateCost = await CostService.create(separateCostPayload, { userId: accountant.id });
    // Transition separateCost to PENDING_FINANCE so PM can attempt to approve it
    separateCost = await CostService.transition(separateCost.id, "PENDING_FINANCE", { userId: accountant.id });
  } catch (err: any) {
    console.error(`Failed to create/submit separateCost: ${err.message}`);
  }

  // Attempt 2.2: Financial Limit Check (PM attempts to approve 150M cost > 100M limit)
  if (separateCost) {
    try {
      await CostService.transition(separateCost.id, "APPROVED", { userId: pm.id });
      printResult("Financial Limit Check (PM > 100M)", false, "System failed to block PM from approving above 100M limit.");
    } catch (err: any) {
      const isLimitBlocked = err.message.includes("Lỗi hạn mức") || err.message.includes("vượt hạn mức");
      printResult(
        "Financial Limit Check (PM > 100M)",
        isLimitBlocked,
        `Blocked PM from approving 150M document. Internal exception: "${err.message}"`
      );
    }
  }

  // CFO approves 150M document successfully (CFO limit is unlimited, and CFO is not the creator)
  if (separateCost) {
    try {
      const approved = await CostService.transition(separateCost.id, "APPROVED", { userId: cfo.id });
      printResult(
        "CFO Unlimited Approval Verification",
        approved.approvalStatus === "APPROVED",
        `CFO successfully approved 150M VND document created by Accountant.`
      );
    } catch (err: any) {
      printResult("CFO Unlimited Approval Verification", false, `Failed to approve: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------------
  // AUDIT TASK 3: DOUBLE-ENTRY ACCRUAL CORRECTNESS AUDIT
  // --------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📚  AUDIT TASK 3: DOUBLE-ENTRY ACCRUAL CORRECTNESS");
  console.log("--------------------------------------------------------------------------------");

  if (separateCost) {
    try {
      // CFO posts approved document to ledger
      const posted = await CostService.transition(separateCost.id, "POSTED", { userId: cfo.id });
      
      printResult(
        "Cost Ledger Posting Transition",
        posted.workflowStatus === "POSTED",
        `Cost record transitioned to POSTED workflow state.`
      );

      // Verify journal entry exists and is balanced
      const journalEntry = await prisma.journalEntry.findFirst({
        where: { sourceId: separateCost.id, sourceType: "COST", deletedAt: null },
        include: { lines: { include: { account: true } } }
      });

      if (journalEntry) {
        const debits = journalEntry.lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));
        const credits = journalEntry.lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));

        const balanced = debits.equals(credits);
        const correctDebitAccount = journalEntry.lines.some(l => l.type === 'DEBIT' && l.account.code === '6210');
        const correctCreditAccount = journalEntry.lines.some(l => l.type === 'CREDIT' && l.account.code === '3310');

        printResult(
          "Double-Entry Balanced Postings",
          balanced && correctDebitAccount && correctCreditAccount,
          `Journal Entry verified: Debit (${debits.toNumber()} ₫, TK 6210 Direct Material) = Credit (${credits.toNumber()} ₫, TK 3310 AP). Balanced: ${balanced}.`
        );
      } else {
        printResult("Double-Entry Balanced Postings", false, "Journal Entry record was not generated.");
      }
    } catch (err: any) {
      printResult("Cost Ledger Posting Transition", false, `Failed: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------------
  // AUDIT TASK 4: SOFT DELETE & IMMUTABLE ROLLBACK SAFETY AUDIT
  // --------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🗑️  AUDIT TASK 4: SOFT DELETE & IMMUTABLE ROLLBACK SAFETY");
  console.log("--------------------------------------------------------------------------------");

  if (separateCost) {
    // Attempt 4.1: Delete Posted Cost Record (Strict Block)
    try {
      await CostService.delete(separateCost.id, { userId: pm.id });
      printResult("Delete Posted Document Prevention", false, "System allowed deletion of posted transaction.");
    } catch (err: any) {
      const isDeleteBlocked = err.message.includes("Không thể xóa chi phí đã được duyệt hoặc ghi sổ");
      printResult(
        "Delete Posted Document Prevention",
        isDeleteBlocked,
        `Blocked deletion of posted transaction. Internal exception: "${err.message}"`
      );
    }

    // Attempt 4.2: Reverse Posted Cost Record (Immutable Journal Reversal)
    try {
      const reversed = await CostService.transition(separateCost.id, "REVERSED", { userId: cfo.id });
      printResult(
        "Reversal Workflow Transition",
        reversed.workflowStatus === "REVERSED",
        `Posted transaction transitioned successfully to REVERSED state.`
      );

      // Verify Reversal Journal entry exists
      const reversalJournal = await prisma.journalEntry.findFirst({
        where: { sourceId: separateCost.id, sourceType: "COST", reference: { startsWith: 'REV-' }, deletedAt: null },
        include: { lines: { include: { account: true } } }
      });

      if (reversalJournal) {
        const debits = reversalJournal.lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));
        const credits = reversalJournal.lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));

        const balanced = debits.equals(credits);
        // Swapped accounts: Debit 3310 (AP), Credit 6210 (Direct Material)
        const correctDebitAccount = reversalJournal.lines.some(l => l.type === 'DEBIT' && l.account.code === '3310');
        const correctCreditAccount = reversalJournal.lines.some(l => l.type === 'CREDIT' && l.account.code === '6210');

        printResult(
          "Immutable Reversal Journal Verification",
          balanced && correctDebitAccount && correctCreditAccount,
          `Reversal entry successfully recorded: Debit (${debits.toNumber()} ₫, TK 3310 AP) = Credit (${credits.toNumber()} ₫, TK 6210 Direct Material). Balanced: ${balanced}.`
        );
      } else {
        printResult("Immutable Reversal Journal Verification", false, "Reversal Journal entry was not created.");
      }
    } catch (err: any) {
      printResult("Reversal Workflow Transition", false, `Failed: ${err.message}`);
    }
  }

  // Attempt 4.3: Soft Delete of Draft Cost Record
  try {
    const draftCostPayload = {
      projectId: project.id,
      wbsId: wbs.id,
      costType: "labor" as const,
      amount: 12000000,
      requestId: "audit-soft-delete-" + Date.now(),
      note: "Nhân công nháp để xóa",
      date: new Date("2026-05-12"),
      supplier: "Công ty Cung ứng Nhân lực",
      status: "unpaid" as const,
      createdById: pm.id
    };

    const draftCost = await CostService.create(draftCostPayload, { userId: pm.id });
    const deleted = await CostService.delete(draftCost.id, { userId: pm.id });

    // Fetch directly using raw query to bypass default deletedAt: null filter in prisma middleware
    const dbRow = await prisma.$queryRaw<any[]>`SELECT "deletedAt" FROM "CostRecord" WHERE id = ${draftCost.id}`;

    printResult(
      "Soft Delete Cascade Verification",
      dbRow.length === 1 && dbRow[0].deletedAt !== null,
      `Soft delete verified. deletedAt timestamp populated in DB: ${dbRow[0].deletedAt}.`
    );
  } catch (err: any) {
    printResult("Soft Delete Cascade Verification", false, `Failed: ${err.message}`);
  }

  // --------------------------------------------------------------------------------
  // AUDIT TASK 5: CLOSED FISCAL PERIOD PROTECTION AUDIT
  // --------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🔒  AUDIT TASK 5: CLOSED FISCAL PERIOD PROTECTION");
  console.log("--------------------------------------------------------------------------------");

  const lockedMonth = "2026-05";
  try {
    // A. CFO locks Fiscal Period "2026-05"
    await prisma.fiscalPeriod.upsert({
      where: { month: lockedMonth },
      update: { isLocked: true, lockedById: cfo.id, lockedAt: new Date() },
      create: { month: lockedMonth, isLocked: true, lockedById: cfo.id, lockedAt: new Date(), companyId: project.companyId }
    });

    console.log(`🔒 CFO locked Fiscal Period ${lockedMonth} successfully.`);

    // B. Attempt to write cost record inside the locked period (2026-05-15)
    const lockedPeriodCostPayload = {
      projectId: project.id,
      wbsId: wbs.id,
      costType: "overhead" as const,
      amount: 5000000,
      requestId: "audit-locked-period-" + Date.now(),
      note: "Chi phí văn phòng phẩm tháng 5 trong kỳ khóa",
      date: new Date("2026-05-15"),
      status: "unpaid" as const,
      createdById: pm.id
    };

    try {
      await CostService.create(lockedPeriodCostPayload, { userId: pm.id });
      printResult("Closed Period Block Protection", false, "System failed to block creation in locked period.");
    } catch (err: any) {
      const isPeriodBlocked = err.message.includes("đã bị khóa") || err.message.includes("locked period");
      printResult(
        "Closed Period Block Protection",
        isPeriodBlocked,
        `Successfully blocked insertion in locked period. Internal exception: "${err.message}"`
      );
    }
  } catch (err: any) {
    console.error(`Failed during Fiscal Period locking: ${err.message}`);
  } finally {
    // C. Unlock period to restore database to clean active state
    await prisma.fiscalPeriod.update({
      where: { month: lockedMonth },
      data: { isLocked: false, lockedAt: null, lockedById: null }
    });
    console.log(`🔓 CFO unlocked Fiscal Period ${lockedMonth} successfully. Clean database state restored.`);
  }

  // --------------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("               📊 FORENSIC AUDIT COMPLETED SUMMARY REPORT");
  console.log("================================================================================");
  console.log(`   Total Forensic Audits Conducted: ${testPassed + testFailed}`);
  console.log(`   ✅ Successful Audits Passed   : ${testPassed}`);
  console.log(`   ❌ Failed Audits (Flaws)      : ${testFailed}`);
  console.log("--------------------------------------------------------------------------------");
  if (testFailed === 0) {
    console.log("🎯 RESULT: HARDENING CONFIRMED. Module is mathematically correct and fully operational.");
  } else {
    console.log("⚠️  RESULT: AUDIT REJECTED. Security and business logic flaws need remediation.");
  }
  console.log("================================================================================\n");
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
