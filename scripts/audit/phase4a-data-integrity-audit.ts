import { PrismaClient } from '../../generated/prisma-client';

const prisma = new PrismaClient();

interface AuditIssue {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  section: string;
  description: string;
  details?: any;
}

const issues: AuditIssue[] = [];

function addIssue(severity: 'Critical' | 'High' | 'Medium' | 'Low', section: string, description: string, details?: any) {
  issues.push({ severity, section, description, details });
  const icon = severity === 'Critical' ? '🔴 [CRITICAL]' : severity === 'High' ? '🟠 [HIGH]' : severity === 'Medium' ? '🟡 [MEDIUM]' : '🔵 [LOW]';
  console.error(`${icon} (${section}): ${description}`);
}

async function runAudit() {
  console.log('=== KỈNH CHỈNH KIỂM THỬ TOÀN VẸN DỮ LIỆU - PHASE 4B ===');
  console.log('Chế độ: Đọc ghi nhận (Read-Only) - Tuyệt đối không thay đổi cơ sở dữ liệu.\n');

  // 1. Kiểm tra Bút toán không cân Nợ/Có (Unbalanced Journal Entries)
  console.log('1. Đang quét bút toán mất cân đối Nợ/Có...');
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

    const diff = Math.abs(debits - credits);
    // Tolerance 0.05 for minor floating point roundings in bookkeeping
    if (diff > 0.05) {
      addIssue(
        'Critical',
        'Journal Balance',
        `Bút toán ${entry.id} (${entry.reference || 'Không có ref'}) không cân Nợ/Có: Nợ = ${debits}, Có = ${credits}, Chênh lệch = ${diff}`,
        { entryId: entry.id, debits, credits, difference: diff }
      );
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
      addIssue(
        'High',
        'Cost Posted Ledger',
        `CostRecord ${cost.id} có trạng thái workflow là POSTED nhưng thiếu JournalEntry đối ứng trong sổ cái kế toán`,
        { costId: cost.id, amount: cost.amount }
      );
    }
  }

  // 3. JournalEntry mồ côi không có chứng từ gốc
  console.log('\n3. Đang kiểm tra JournalEntries mồ côi (tham chiếu chứng từ đã bị xóa hoặc không tồn tại)...');
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
      if (!exists) {
        addIssue(
          'Medium',
          'Orphan JournalEntry',
          `JournalEntry ${j.id} tham chiếu CostRecord ${j.sourceId} không tồn tại trong hệ thống`,
          { journalId: j.id, sourceType: j.sourceType, sourceId: j.sourceId }
        );
      } else if (exists.deletedAt !== null) {
        addIssue(
          'Low',
          'Orphan JournalEntry',
          `JournalEntry ${j.id} tham chiếu CostRecord ${j.sourceId} đã bị đánh dấu xóa (soft deleted)`,
          { journalId: j.id, sourceType: j.sourceType, sourceId: j.sourceId }
        );
      }
    } else if (j.sourceType === 'INVOICE') {
      const exists = await prisma.invoice.findUnique({ where: { id: j.sourceId || '' } });
      if (!exists) {
        addIssue(
          'Medium',
          'Orphan JournalEntry',
          `JournalEntry ${j.id} tham chiếu Invoice ${j.sourceId} không tồn tại trong hệ thống`,
          { journalId: j.id, sourceType: j.sourceType, sourceId: j.sourceId }
        );
      } else if (exists.deletedAt !== null) {
        addIssue(
          'Low',
          'Orphan JournalEntry',
          `JournalEntry ${j.id} tham chiếu Invoice ${j.sourceId} đã bị đánh dấu xóa (soft deleted)`,
          { journalId: j.id, sourceType: j.sourceType, sourceId: j.sourceId }
        );
      }
    }
  }

  // 4. Payment không gắn project hay invoice/contract
  console.log('\n4. Đang kiểm tra Payments không hợp lệ (thiếu liên kết hóa đơn hoặc hợp đồng)...');
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null }
  });
  for (const p of payments) {
    if (!p.projectId) {
      addIssue(
        'High',
        'Payment Integrity',
        `Payment ${p.id} không liên kết với bất kỳ ProjectId nào`,
        { paymentId: p.id }
      );
    }
    // Tạm ứng hợp đồng không cần invoiceId, nhưng cần phải có contractId hoặc invoiceId
    if (!p.invoiceId && !p.contractId) {
      addIssue(
        'High',
        'Payment Integrity',
        `Payment ${p.id} không có thông tin liên kết Invoice hay Contract (Không thuộc loại tạm ứng hay thanh toán hợp lệ)`,
        { paymentId: p.id }
      );
    }
  }

  // 5. Cost không gắn project/WBS
  console.log('\n5. Đang kiểm tra chi phí mồ côi (thiếu ProjectId hoặc WbsId)...');
  const costs = await prisma.costRecord.findMany({
    where: { deletedAt: null }
  });
  for (const c of costs) {
    if (!c.projectId) {
      addIssue('High', 'Cost Record Integrity', `CostRecord ${c.id} không liên kết ProjectId`, { costId: c.id });
    }
    if (!c.wbsId) {
      addIssue('High', 'Cost Record Integrity', `CostRecord ${c.id} không có WbsId`, { costId: c.id });
    }
  }

  // 6. WBS không gắn project
  console.log('\n6. Đang kiểm tra WBS Items không thuộc dự án nào...');
  const wbsItems = await prisma.wBSItem.findMany({
    where: { deletedAt: null }
  });
  for (const w of wbsItems) {
    if (!w.projectId) {
      addIssue('High', 'WBS Item Integrity', `WBSItem ${w.id} không liên kết với bất kỳ dự án nào`, { wbsId: w.id });
    }
  }

  // 7. Budget không gắn WBS/project
  console.log('\n7. Đang kiểm tra BudgetRecords mồ côi...');
  const budgets = await prisma.budgetRecord.findMany({
    where: { deletedAt: null }
  });
  for (const b of budgets) {
    if (!b.projectId) {
      addIssue('High', 'Budget Record Integrity', `BudgetRecord ${b.id} không có ProjectId`, { budgetId: b.id });
    }
    if (!b.wbsId) {
      addIssue('High', 'Budget Record Integrity', `BudgetRecord ${b.id} không có WbsId`, { budgetId: b.id });
    }
  }

  // 8. Invoice có tổng tiền sai công thức VAT (Dùng tolerance 5 VND cho VND)
  console.log('\n8. Đang kiểm tra tính toán VAT của các Hóa đơn...');
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null }
  });
  for (const inv of invoices) {
    const net = Number(inv.netAmount || 0);
    const vat = Number(inv.vatAmount || 0);
    const amount = Number(inv.amount || 0);
    const diff = Math.abs(amount - (net + vat));
    
    // Tolerance 5 VND cho làm tròn số
    if (diff > 5) {
      addIssue(
        'Critical',
        'Invoice VAT Calculations',
        `Hóa đơn ${inv.id} sai tổng tiền: Net (${net}) + VAT (${vat}) = ${net + vat} nhưng ghi nhận là ${amount} (Lệch ${diff} VND)`,
        { invoiceId: inv.id, netAmount: net, vatAmount: vat, amount, difference: diff }
      );
    }
  }

  // 9. Debt còn lại âm bất thường
  console.log('\n9. Đang kiểm tra công nợ còn lại (remaining amount)...');
  for (const inv of invoices) {
    const rem = Number(inv.remainingAmount);
    if (rem < -0.01) {
      addIssue(
        'Critical',
        'Invoice Remaining Amount',
        `Hóa đơn ${inv.id} có công nợ còn lại âm bất thường: ${rem}`,
        { invoiceId: inv.id, remaining: rem }
      );
    }
  }

  // 10. Tồn kho âm hoặc không nhất quán (Logic số dư thực tế kép)
  console.log('\n10. Đang kiểm tra tồn kho âm thực tế...');
  const txs = await prisma.inventoryTransaction.findMany({});
  
  if (txs.length === 0) {
    console.log('ℹ️ Không có giao dịch kho nào được tìm thấy trong hệ thống.');
  } else {
    const groups: Record<string, { materialId: string; projectId: string; quantitySum: number; typeAwareSum: number }> = {};
    for (const tx of txs) {
      const key = `${tx.materialId}_${tx.projectId}`;
      if (!groups[key]) {
        groups[key] = { materialId: tx.materialId, projectId: tx.projectId, quantitySum: 0, typeAwareSum: 0 };
      }
      const q = Number(tx.quantity);
      groups[key].quantitySum += q;
      
      // logic số dư thực tế kép
      if (tx.type === 'RECEIPT' || tx.type === 'RETURN') {
        groups[key].typeAwareSum += Math.abs(q);
      } else if (tx.type === 'ISSUE') {
        groups[key].typeAwareSum -= Math.abs(q);
      } else {
        groups[key].typeAwareSum += q;
      }
    }

    let negativeStockCount = 0;
    for (const [key, g] of Object.entries(groups)) {
      // Chỉ kết luận âm kho nếu cả 2 phương thức tính toán (simple sum và type-aware sum) đều âm
      if (g.quantitySum < -0.001 && g.typeAwareSum < -0.001) {
        addIssue(
          'High',
          'Negative Inventory Balance',
          `Vật tư ${g.materialId} thuộc dự án ${g.projectId} có tồn kho âm thực tế: Simple Sum = ${g.quantitySum}, Type-Aware Sum = ${g.typeAwareSum}`,
          { materialId: g.materialId, projectId: g.projectId, quantitySum: g.quantitySum, typeAwareSum: g.typeAwareSum }
        );
        negativeStockCount++;
      }
    }
    
    if (negativeStockCount === 0) {
      console.log('✅ Không phát hiện tồn kho âm thực tế.');
    }
  }

  console.log('\n=== KẾT QUẢ KIỂM THỬ TOÀN VẸN DỮ LIỆU ===');
  const criticals = issues.filter(i => i.severity === 'Critical');
  const highs = issues.filter(i => i.severity === 'High');
  const mediums = issues.filter(i => i.severity === 'Medium');
  const lows = issues.filter(i => i.severity === 'Low');

  console.log(`Tổng số lỗi phát hiện: ${issues.length}`);
  console.log(`- Critical: ${criticals.length}`);
  console.log(`- High: ${highs.length}`);
  console.log(`- Medium: ${mediums.length}`);
  console.log(`- Low: ${lows.length}`);

  const hasBlockers = criticals.length > 0 || highs.length > 0;
  if (!hasBlockers) {
    console.log('✅ HỆ THỐNG ĐẠT ĐỘ TOÀN VẸN 100% - KHÔNG CÓ SAI LỆCH DỮ LIỆU LIÊN QUAN ĐẾN CÁC LỖI BLOCKER');
    process.exitCode = 0;
  } else {
    console.warn('⚠️ PHÁT HIỆN SỰ CỐ DỮ LIỆU CẦN ĐƯỢC XỬ LÝ (Có lỗi Critical hoặc High)');
    process.exitCode = 1;
  }
}

runAudit()
  .catch(err => {
    console.error('Fatal error during audit:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
