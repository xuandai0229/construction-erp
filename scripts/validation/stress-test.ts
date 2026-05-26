import { CostService } from "../services/cost.service";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("🚀 Bắt đầu STRESS TEST: Mass Data Generation & Concurrency");
  
  const projectId = "2fa9e808-761f-4532-8d0c-85e748aaaeb4";
  const wbsId = "73533917-034d-4a2a-ba6d-968b783ba55b";
  
  // 1. Concurrent Test (10 users submitting at the exact same time)
  console.log("\n[1] Mô phỏng 10 User bấm Submit cùng lúc (Race Condition)...");
  const duplicateId = "concurrent-spam-id-" + Date.now();
  const promises = [];
  for(let i = 0; i < 10; i++) {
    promises.push(CostService.create({
      projectId, 
      wbsId, 
      costType: "material" as any, 
      amount: 500000, 
      requestId: duplicateId, 
      note: "Spam submit " + i, 
      status: "unpaid",
      vatRate: 10,
      retentionRate: 0
    }));
  }
  
  const results = await Promise.allSettled(promises);
  const successCount = results.filter(r => r.status === "fulfilled").length;
  console.log(`✅ Hoàn thành Spam Submit. Số request thành công (không throw): ${successCount}/10`);
  const spamCount = await prisma.costRecord.count({ where: { requestId: duplicateId } });
  console.log(`✅ Số bản ghi thực tế tạo ra trong DB: ${spamCount} (Kỳ vọng: 1)`);

  // 2. Mass Data Generation (1000 Cost Records)
  console.log("\n[2] Đang tạo 1000 Cost Records để Test Load & Ledger...");
  
  const batchSize = 100;
  for(let i = 0; i < 10; i++) {
    const data = Array.from({ length: batchSize }).map((_, j) => ({
      id: crypto.randomUUID(),
      projectId,
      wbsId,
      costType: "material",
      amount: Math.floor(Math.random() * 1000000) + 100000,
      quantity: 1,
      unitPrice: 0,
      vatRate: 10,
      retentionRate: 0,
      supplier: "Nhà cung cấp " + (i*batchSize + j),
      note: "Auto generated cost",
      status: "unpaid",
      approvalStatus: "DRAFT",
      workflowStatus: "DRAFT",
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
    }));
    await prisma.costRecord.createMany({ data: data as any });
    process.stdout.write(`Đã tạo ${i * batchSize + batchSize}/1000...\r`);
  }
  console.log("\n✅ Hoàn thành tạo 1000 chi phí.");

  // 3. Verify Database Consistency
  console.log("\n[3] Kiểm tra tính toàn vẹn Kế toán (Ledger Integrity)...");
  const journals = await prisma.journalEntry.findMany({ include: { lines: true } });
  let unbalanced = 0;
  for (const j of journals) {
    const d = j.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
    const c = j.lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
    if (d !== c) unbalanced++;
  }
  console.log(`✅ Lệch Sổ cái (Unbalanced Journals): ${unbalanced} / ${journals.length}`);

  // Find Orphan Transaction Lines
  const orphanLines = await prisma.transactionLine.count({ where: { journalEntryId: null as any } });
  console.log(`✅ Dòng Transaction mồ côi (Orphan lines): ${orphanLines}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
