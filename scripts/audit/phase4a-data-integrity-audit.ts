import { PrismaClient } from '../../generated/prisma-client';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('=== KỈNH CHỈNH KIỂM THỬ TOÀN VẸN DỮ LIỆU - PHASE 4A ===');
  let issuesCount = 0;

  // 1. Kiểm tra Bút toán không cân Nợ/Có (Unbalanced Journal Entries)
  console.log('\n1. Đang quét bút toán mất cân đối Nợ/Có...');
  const entries = await prisma.journalEntry.findMany({
    where: { deletedAt: null },
    include: { lines: { where: { deletedAt: null } } }
  });

  for (const entry of entries) {
    const debits = entry.lines
      .filter(l => l.type === 'DEBIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    const credits = entry.lines
      .filter(l => l.type === 'CREDIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);

    if (Math.abs(debits - credits) > 0.01) {
      console.error(`❌ [LỖI NGHIÊM TRỌNG] Bút toán ${entry.id} (${entry.reference}) không cân: Nợ = ${debits}, Có = ${credits}`);
      issuesCount++;
    }
  }

  // 2. Chứng từ đã POSTED nhưng không có JournalEntry
  console.log('\n2. Đang kiểm tra CostRecords POSTED không có JournalEntry...');
  const postedCosts = await prisma.costRecord.findMany({
    where: { workflowStatus: 'POSTED', deletedAt: null }
  });
  for (const cost of postedCosts) {
    const journal = await prisma.journalEntry.findFirst({
      where: { sourceId: cost.id, sourceType: 'COST', deletedAt: null }
    });
    if (!journal) {
      console.error(`❌ [LỖI HIGH] CostRecord ${cost.id} có trạng thái POSTED nhưng thiếu JournalEntry trong sổ cái`);
      issuesCount++;
    }
  }

  // 3. JournalEntry mồ côi không có chứng từ gốc
  console.log('\n3. Đang kiểm tra JournalEntries mồ côi (không có nguồn gốc hợp lệ)...');
  const orphanJournals = await prisma.journalEntry.findMany({
    where: {
      deletedAt: null,
      sourceType: { not: null },
      sourceId: { not: null }
    }
  });
  for (const j of orphanJournals) {
    if (j.sourceType === 'COST') {
      const exists = await prisma.costRecord.findUnique({ where: { id: j.sourceId || '' } });
      if (!exists || exists.deletedAt !== null) {
        console.warn(`⚠️ [CẢNH BÁO] JournalEntry ${j.id} tham chiếu CostRecord ${j.sourceId} không tồn tại hoặc đã bị xóa`);
      }
    } else if (j.sourceType === 'INVOICE') {
      const exists = await prisma.invoice.findUnique({ where: { id: j.sourceId || '' } });
      if (!exists || exists.deletedAt !== null) {
        console.warn(`⚠️ [CẢNH BÁO] JournalEntry ${j.id} tham chiếu Invoice ${j.sourceId} không tồn tại hoặc đã bị xóa`);
      }
    }
  }

  // 4. Payment không gắn debt/invoice/project
  console.log('\n4. Đang kiểm tra Payments không hợp lệ (thiếu liên kết hóa đơn hoặc dự án)...');
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null }
  });
  for (const p of payments) {
    if (!p.projectId) {
      console.error(`❌ [LỖI HIGH] Payment ${p.id} không liên kết với ProjectId`);
      issuesCount++;
    }
    if (!p.invoiceId && !p.contractId) {
      console.error(`❌ [LỖI HIGH] Payment ${p.id} không có thông tin liên kết Invoice hay Contract`);
      issuesCount++;
    }
  }

  // 5. Cost không gắn project/WBS
  console.log('\n5. Đang kiểm tra chi phí mồ côi...');
  const costs = await prisma.costRecord.findMany({
    where: { deletedAt: null }
  });
  for (const c of costs) {
    if (!c.projectId) {
      console.error(`❌ [LỖI HIGH] CostRecord ${c.id} không liên kết ProjectId`);
      issuesCount++;
    }
    if (!c.wbsId) {
      console.error(`❌ [LỖI HIGH] CostRecord ${c.id} không có WbsId`);
      issuesCount++;
    }
  }

  // 6. WBS không gắn project
  console.log('\n6. Đang kiểm tra WBS Items không thuộc dự án nào...');
  const wbsItems = await prisma.wBSItem.findMany({
    where: { deletedAt: null }
  });
  for (const w of wbsItems) {
    if (!w.projectId) {
      console.error(`❌ [LỖI HIGH] WBSItem ${w.id} không liên kết với bất kỳ dự án nào`);
      issuesCount++;
    }
  }

  // 7. Budget không gắn WBS/project
  console.log('\n7. Đang kiểm tra BudgetRecords mồ côi...');
  const budgets = await prisma.budgetRecord.findMany({
    where: { deletedAt: null }
  });
  for (const b of budgets) {
    if (!b.projectId) {
      console.error(`❌ [LỖI HIGH] BudgetRecord ${b.id} không có ProjectId`);
      issuesCount++;
    }
    if (!b.wbsId) {
      console.error(`❌ [LỖI HIGH] BudgetRecord ${b.id} không có WbsId`);
      issuesCount++;
    }
  }

  // 8. Invoice có tổng tiền sai công thức VAT
  console.log('\n8. Đang kiểm tra tính toán VAT của các Hóa đơn...');
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null }
  });
  for (const inv of invoices) {
    const net = Number(inv.netAmount || 0);
    const vat = Number(inv.vatAmount || 0);
    const amount = Number(inv.amount || 0);
    if (Math.abs(amount - (net + vat)) > 1) {
      console.error(`❌ [LỖI CRITICAL] Hóa đơn ${inv.id} sai tổng tiền: Net (${net}) + VAT (${vat}) = ${net + vat} nhưng tổng ghi nhận là ${amount}`);
      issuesCount++;
    }
  }

  // 9. Debt còn lại âm bất thường
  console.log('\n9. Đang kiểm tra công nợ còn lại (remaining amount)...');
  for (const inv of invoices) {
    const rem = Number(inv.remainingAmount);
    if (rem < -0.01) {
      console.error(`❌ [LỖI CRITICAL] Hóa đơn ${inv.id} có công nợ còn lại âm bất thường: ${rem}`);
      issuesCount++;
    }
  }

  // 10. Tồn kho âm hoặc không nhất quán
  console.log('\n10. Đang kiểm tra tồn kho âm...');
  const negInventory = await prisma.inventoryTransaction.findMany({
    where: { quantity: { lt: 0 } }
  });
  if (negInventory.length > 0) {
    console.error(`❌ [LỖI HIGH] Phát hiện ${negInventory.length} giao dịch tồn kho âm`);
    issuesCount += negInventory.length;
  }

  console.log('\n=== KẾT QUẢ KIỂM THỬ TOÀN VẸN DỮ LIỆU ===');
  console.log(`Tổng số lỗi phát hiện: ${issuesCount}`);
  if (issuesCount === 0) {
    console.log('✅ HỆ THỐNG ĐẠT ĐỘ TOÀN VẸN 100% - KHÔNG CÓ SAI LỆCH DỮ LIỆU');
  } else {
    console.warn('⚠️ PHÁT HIỆN SỰ CỐ DỮ LIỆU CẦN ĐƯỢC XỬ LÝ');
  }

  process.exitCode = issuesCount === 0 ? 0 : 1;
}

runAudit()
  .catch(err => {
    console.error('Fatal error during audit:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
