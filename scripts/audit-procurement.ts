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
import { ProcurementService } from "../services/procurement.service";
import { CostService } from "../services/cost.service";

async function runAudit() {
  console.log("\n================================================================================");
  console.log("            📦 PHASE 4 FORENSIC AUDIT: PROCUREMENT 3-WAY MATCHING");
  console.log("================================================================================\n");

  const project = await prisma.project.findFirst({
    where: { name: 'Khu Đô Thị Thông Minh Vinhomes Ocean Park 3', deletedAt: null }
  });
  if (!project) throw new Error("Project not found.");

  const wbs = await prisma.wBSItem.findFirst({
    where: { projectId: project.id, code: 'WBS-01-01', deletedAt: null }
  });
  if (!wbs) throw new Error("WBS-01-01 not found.");

  const pm = await prisma.user.findUnique({ where: { email: 'pm@hoabinhcorp.com' } });
  const cfo = await prisma.user.findUnique({ where: { email: 'cfo@hoabinhcorp.com' } });
  if (!pm || !cfo) throw new Error("Users not found.");

  await prisma.fiscalPeriod.upsert({
    where: { month: "2026-05" },
    update: { isLocked: false, lockedAt: null, lockedById: null },
    create: { month: "2026-05", isLocked: false, companyId: project.companyId }
  });

  const accounts = [
    { code: '3310', name: 'Phải trả người bán (AP)', type: 'LIABILITY' as const },
    { code: '3311', name: 'Phải trả người bán chưa có hóa đơn (GRNI)', type: 'LIABILITY' as const },
    { code: '6210', name: 'Chi phí NVL trực tiếp', type: 'EXPENSE' as const },
  ];
  for (const acc of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: acc
    });
  }

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
  console.log("🛒 TASK 1: PURCHASE ORDER (PO) & GOODS RECEIPT (GRN) CREATION");
  console.log("--------------------------------------------------------------------------------");

  let po: any, grn: any;
  try {
    po = await ProcurementService.createPO({
      projectId: project.id,
      vendor: "Nhà Cung Cấp Thép Pomina",
      description: "Thép xây dựng móng",
      items: [{
        wbsId: wbs.id,
        description: "Thép vằn D16",
        quantity: 1000,
        unitPrice: 20000,
        costType: "material"
      }],
      createdById: pm.id
    });
    printResult("Create PO", !!po.id, `Created PO: ${po.id}, Status: ${po.status}`);

    grn = await ProcurementService.createGoodsReceipt({
      purchaseOrderId: po.id,
      projectId: project.id,
      notes: "Nhập đủ hàng",
      receivedById: pm.id
    });
    printResult("Create GRN", !!grn.id, `Created GRN: ${grn.id}`);

    // Verify GRN Ledger Post
    const grnJournal = await prisma.journalEntry.findFirst({
      where: { sourceId: grn.id, sourceType: "GRN" },
      include: { lines: { include: { account: true } } }
    });

    if (grnJournal) {
      const debit6210 = grnJournal.lines.some((l: any) => l.type === 'DEBIT' && l.account.code === '6210');
      const credit3311 = grnJournal.lines.some((l: any) => l.type === 'CREDIT' && l.account.code === '3311');
      printResult("GRN Accounting: Debit Inventory/WIP (6210) & Credit GRNI (3311)", debit6210 && credit3311, "Journal verified.");
    } else {
      printResult("GRN Accounting", false, "No journal found.");
    }
  } catch (err: any) {
    printResult("PO/GRN Creation", false, err.message);
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("⚖️  TASK 2: 3-WAY MATCHING (BLOCKING MISMATCHES)");
  console.log("--------------------------------------------------------------------------------");

  if (po) {
    try {
      // Missing GRN Check (we create a new PO with NO GRN)
      const poNoGrn = await ProcurementService.createPO({
        projectId: project.id,
        vendor: "NCC Gạch",
        items: [{ wbsId: wbs.id, description: "Gạch", quantity: 100, unitPrice: 1000, costType: "material" }],
        createdById: pm.id
      });
      await CostService.create({
        projectId: project.id,
        wbsId: wbs.id,
        costType: "material",
        amount: 100000,
        quantity: 100,
        unitPrice: 1000,
        status: "unpaid",
        purchaseOrderId: poNoGrn.id,
        requestId: "audit-3way-" + Date.now()
      } as any, { userId: pm.id });
      printResult("Block missing GRN", false, "Allowed Invoice without GRN");
    } catch (err: any) {
      printResult("Block missing GRN", err.message.includes("chưa có Phiếu Nhập Kho"), err.message);
    }

    try {
      // Over quantity Check
      await CostService.create({
        projectId: project.id,
        wbsId: wbs.id,
        costType: "material",
        amount: 20000000, // exact amount, but wrong quantity
        quantity: 1200, // PO is 1000
        unitPrice: 20000,
        status: "unpaid",
        purchaseOrderId: po.id,
        requestId: "audit-3way-qty-" + Date.now()
      } as any, { userId: pm.id });
      printResult("Block Over-Quantity", false, "Allowed Invoice with > PO quantity");
    } catch (err: any) {
      printResult("Block Over-Quantity", err.message.includes("vượt quá số lượng đặt mua"), err.message);
    }

    try {
      // Price Mismatch Check
      await CostService.create({
        projectId: project.id,
        wbsId: wbs.id,
        costType: "material",
        amount: 25000000, // PO is 20000000
        quantity: 1000,
        unitPrice: 25000,
        status: "unpaid",
        purchaseOrderId: po.id,
        requestId: "audit-3way-price-" + Date.now()
      } as any, { userId: pm.id });
      printResult("Block Price Mismatch", false, "Allowed Invoice with price > 5% over PO");
    } catch (err: any) {
      printResult("Block Price Mismatch", err.message.includes("vượt quá giá trị PO"), err.message);
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log("🧾 TASK 3: AP INVOICE CREATION & PROCUREMENT ACCOUNTING");
  console.log("--------------------------------------------------------------------------------");

  if (po && grn) {
    try {
      // Exact Match
      const cost = await CostService.create({
        projectId: project.id,
        wbsId: wbs.id,
        costType: "material",
        amount: 20000000, // exact match
        quantity: 1000,
        unitPrice: 20000,
        status: "unpaid",
        purchaseOrderId: po.id,
        requestId: "audit-3way-success-" + Date.now()
      } as any, { userId: pm.id });
      printResult("3-Way Match Success", !!cost.id, "Invoice matched PO & GRN successfully.");

      // CFO Approves and Posts
      await CostService.transition(cost.id, "PENDING_FINANCE", { userId: pm.id });
      await CostService.transition(cost.id, "APPROVED", { userId: cfo.id });
      await CostService.transition(cost.id, "POSTED", { userId: cfo.id });

      const apJournal = await prisma.journalEntry.findFirst({
        where: { sourceId: cost.id, sourceType: "COST" },
        include: { lines: { include: { account: true } } }
      });

      if (apJournal) {
        const debit3311 = apJournal.lines.some((l: any) => l.type === 'DEBIT' && l.account.code === '3311');
        const credit3310 = apJournal.lines.some((l: any) => l.type === 'CREDIT' && l.account.code === '3310');
        printResult("AP Accounting: Debit GRNI (3311) & Credit AP (3310)", debit3311 && credit3310, "Journal verified.");
      } else {
        printResult("AP Accounting", false, "No journal found for AP invoice.");
      }
    } catch (err: any) {
      printResult("AP Invoice Processing", false, err.message);
    }
  }

  const total = testPassed + testFailed;
  console.log("\n================================================================================");
  console.log(`🎯 PHASE 4 AUDIT SUMMARY: ${testPassed}/${total} PASSED | ${testFailed} FAILED`);
  console.log(`   Success Rate: ${total > 0 ? Math.round(testPassed / total * 100) : 0}%`);
  console.log("================================================================================\n");
}

runAudit().catch(e => {
  console.error("Fatal Error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
