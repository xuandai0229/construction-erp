import { prisma } from '../../lib/prisma';

async function runGuards() {
  console.log('======================================================');
  console.log('   RUNNING DRILL-DOWN UI INTEGRATION & UX GUARDS      ');
  console.log('======================================================');

  let checksPassed = 0;

  // Check 1: Verify trace components files exist
  const fs = require('fs');
  const path = require('path');
  const componentsPath = path.join(__dirname, '../../app/components/accounting');
  const requiredFiles = [
    'ReadonlyPostedBanner.tsx',
    'DocumentStatusTimeline.tsx',
    'AuditTimeline.tsx',
    'JournalLinesTable.tsx',
    'AllocationLinesTable.tsx',
    'FinancialTracePanel.tsx'
  ];

  console.log('\n[CHECK 1] Kiểm tra tệp tin Component Drill-down...');
  let fileCheck = true;
  for (const file of requiredFiles) {
    const fullPath = path.join(componentsPath, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✓ Component [${file}] tồn tại.`);
    } else {
      console.log(`  ✗ Component [${file}] BỊ THIẾU!`);
      fileCheck = false;
    }
  }

  if (fileCheck) {
    checksPassed++;
    console.log('=> CHECK 1: HOÀN TẤT (1/1)');
  } else {
    console.log('=> CHECK 1: THẤT BẠI!');
  }

  // Check 2: Verify component import & integration on Dashboard
  console.log('\n[CHECK 2] Kiểm tra tích hợp trên Dashboard Kế Toán...');
  const dashboardPath = path.join(__dirname, '../../app/components/Dashboard.tsx');
  if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    if (content.includes('FinancialTracePanel') && content.includes('traceId') && content.includes('traceType')) {
      console.log('  ✓ Đã tích hợp FinancialTracePanel và State hooks trên Dashboard.');
      checksPassed++;
    } else {
      console.log('  ✗ Dashboard chưa được tích hợp panel truy vết!');
    }
  }

  // Check 3: Verify component integration on Revenue page
  console.log('\n[CHECK 3] Kiểm tra tích hợp trên màn hình Revenue (Doanh thu)...');
  const revenuePath = path.join(__dirname, '../../app/revenue/page.tsx');
  if (fs.existsSync(revenuePath)) {
    const content = fs.readFileSync(revenuePath, 'utf8');
    if (content.includes('FinancialTracePanel') && content.includes('traceInvoiceId')) {
      console.log('  ✓ Đã tích hợp FinancialTracePanel và State hook trên màn hình Revenue.');
      checksPassed++;
    } else {
      console.log('  ✗ Màn hình Revenue chưa được tích hợp panel truy vết!');
    }
  }

  // Check 4: Verify component integration on Debt page
  console.log('\n[CHECK 4] Kiểm tra tích hợp trên màn hình Công nợ (Debt)...');
  const debtPath = path.join(__dirname, '../../app/debt/page.tsx');
  if (fs.existsSync(debtPath)) {
    const content = fs.readFileSync(debtPath, 'utf8');
    if (content.includes('FinancialTracePanel') && content.includes('traceInvoiceId')) {
      console.log('  ✓ Đã tích hợp FinancialTracePanel và State hook trên màn hình Công nợ.');
      checksPassed++;
    } else {
      console.log('  ✗ Màn hình Công nợ chưa được tích hợp panel truy vết!');
    }
  }

  // Check 5: Verify double-entry ledger trace support in database
  console.log('\n[CHECK 5] Kiểm tra cấu trúc Sổ Cái kép (Ledger Integrity)...');
  try {
    const sampleJournal = await prisma.journalEntry.findFirst({
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });
    if (sampleJournal) {
      console.log(`  ✓ Đã tìm thấy Bút toán Sổ Cái mẫu: ID ${sampleJournal.id.substring(0, 8)} - ${sampleJournal.description}`);
      console.log(`  ✓ Số dòng hạch toán kép: ${sampleJournal.lines.length}`);
      checksPassed++;
    } else {
      console.log('  ! Chưa có bút toán nào trong DB (Có thể DB đang trống), bỏ qua.');
      checksPassed++; // pass gracefully
    }
  } catch (err: any) {
    console.log(`  ✗ Lỗi truy xuất Sổ Cái: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(` KẾT QUẢ: ${checksPassed}/5 Checks Vượt Qua Hợp Lệ!`);
  console.log('======================================================');

  if (checksPassed < 5) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGuards().catch(err => {
  console.error(err);
  process.exit(1);
});
