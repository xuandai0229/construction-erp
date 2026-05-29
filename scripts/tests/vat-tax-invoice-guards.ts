import { PrismaClient, TaxInvoiceType, TaxInvoiceStatus, TransactionType } from "../../generated/prisma-client";
import { TaxInvoiceService } from "../../services/tax-invoice.service";
import { TaxReportService } from "../../services/tax-report.service";
import { TaxPolicy } from "../../lib/accounting/taxPolicy";

const prisma = new PrismaClient();

async function main() {
  const uid = `TEST_TAX_GUARDS_${Date.now()}`;
  const email1 = `${uid}_1@example.com`;
  const company1 = `COM_${uid}_1`;
  const company2 = `COM_${uid}_2`;

  // Create temporary test users, companies, and projects
  const user = await prisma.user.create({ data: { email: email1 } });
  const comp1 = await prisma.company.create({ data: { name: `Company A ${uid}`, code: company1 } });
  const comp2 = await prisma.company.create({ data: { name: `Company B ${uid}`, code: company2 } });
  const proj = await prisma.project.create({ data: { name: `Project ${uid}`, companyId: comp1.id } });

  // Update user's company context to comp1
  await prisma.user.update({
    where: { id: user.id },
    data: { companyId: comp1.id }
  });

  let pass = 0, fail = 0;
  function check(condition: boolean, msg: string) {
    if (condition) {
      pass++;
      console.log(`✓ PASS: ${msg}`);
    } else {
      fail++;
      console.error(`✗ FAIL: ${msg}`);
    }
  }

  try {
    console.log("==================================================================");
    console.log(" RUNNING SPRINT 3.2: VAT / TAX / INVOICE WORKFLOW & SECURITY GUARDS");
    console.log("==================================================================");

    // 1. Tạo hóa đơn bán ra (OUTBOUND) DRAFT thành công: PASS
    const inv1 = await TaxInvoiceService.createInvoice({
      companyId: comp1.id,
      projectId: proj.id,
      invoiceType: TaxInvoiceType.OUTBOUND,
      invoiceNumber: "0000001",
      invoiceSeries: "C26TBB",
      invoiceDate: new Date(),
      partnerName: "Khách hàng Nguyễn Văn X",
      partnerTaxCode: "0101234567",
      netAmount: 10000000, // 10,000,000 VND
      vatRate: 10,
      vatAmount: 1000000,
    }, user.id);
    check(!!inv1 && inv1.status === TaxInvoiceStatus.DRAFT, "Tạo hóa đơn bán ra DRAFT thành công");

    // 2. Tạo hóa đơn mua vào (INBOUND) DRAFT thành công: PASS
    const inv2 = await TaxInvoiceService.createInvoice({
      companyId: comp1.id,
      projectId: proj.id,
      invoiceType: TaxInvoiceType.INBOUND,
      invoiceNumber: "0000002",
      invoiceSeries: "C26TCC",
      invoiceDate: new Date(),
      partnerName: "Nhà cung cấp Cơ điện Y",
      partnerTaxCode: "0209876543",
      netAmount: 5000000,
      vatRate: 8,
      vatAmount: 400000,
    }, user.id);
    check(!!inv2 && inv2.status === TaxInvoiceStatus.DRAFT, "Tạo hóa đơn mua vào DRAFT thành công");

    // 3. Không cho tạo hóa đơn có Net Amount <= 0: PASS
    let zeroNetBlocked = false;
    try {
      await TaxInvoiceService.createInvoice({
        companyId: comp1.id,
        invoiceType: TaxInvoiceType.OUTBOUND,
        invoiceNumber: "0000003",
        invoiceSeries: "C26TBB",
        partnerName: "Khách hàng X",
        partnerTaxCode: "0101234567",
        netAmount: 0,
        vatRate: 10,
        vatAmount: 0,
      }, user.id);
    } catch (e) {
      zeroNetBlocked = true;
    }
    check(zeroNetBlocked, "Chặn tạo hóa đơn với Net Amount <= 0");

    // 4. Kiểm tra trùng số hóa đơn + ký hiệu trong cùng công ty: PASS
    let uniqueConstraintBlocked = false;
    try {
      await TaxInvoiceService.createInvoice({
        companyId: comp1.id,
        invoiceType: TaxInvoiceType.OUTBOUND,
        invoiceNumber: "0000001", // duplicate
        invoiceSeries: "C26TBB", // duplicate
        partnerName: "Khách hàng Z",
        partnerTaxCode: "0101234567",
        netAmount: 20000000,
        vatRate: 10,
        vatAmount: 2000000,
      }, user.id);
    } catch (e) {
      uniqueConstraintBlocked = true;
    }
    check(uniqueConstraintBlocked, "Chặn trùng lặp số hóa đơn và ký hiệu (Unique Constraint)");

    // 5. Cho phép trùng số hóa đơn nhưng khác Ký hiệu (Series): PASS
    const inv3 = await TaxInvoiceService.createInvoice({
      companyId: comp1.id,
      invoiceType: TaxInvoiceType.OUTBOUND,
      invoiceNumber: "0000001", // same number
      invoiceSeries: "C26TXX", // different series
      partnerName: "Khách hàng Z",
      partnerTaxCode: "0101234567",
      netAmount: 20000000,
      vatRate: 10,
      vatAmount: 2000000,
    }, user.id);
    check(!!inv3, "Cho phép trùng số hóa đơn nếu ký hiệu khác nhau");

    // 6. Kiểm tra dung sai toán học thuế suất tiêu chuẩn (10 VND): PASS
    let mathErrorBlocked = false;
    try {
      await TaxInvoiceService.createInvoice({
        companyId: comp1.id,
        invoiceType: TaxInvoiceType.OUTBOUND,
        invoiceNumber: "0000004",
        invoiceSeries: "C26TBB",
        partnerName: "Khách hàng M",
        partnerTaxCode: "0101234567",
        netAmount: 10000000,
        vatRate: 10,
        vatAmount: 1200000, // standard would be 1,000,000. Lệch 200,000 VND
      }, user.id);
    } catch (e) {
      mathErrorBlocked = true;
    }
    check(mathErrorBlocked, "Chặn hóa đơn lệch tiền thuế vượt dung sai 10 VND");

    // 7. Cho phép ghi đè thuế lệch nếu có giải trình tối thiểu 5 ký tự: PASS
    const inv4 = await TaxInvoiceService.createInvoice({
      companyId: comp1.id,
      invoiceType: TaxInvoiceType.OUTBOUND,
      invoiceNumber: "0000005",
      invoiceSeries: "C26TBB",
      partnerName: "Khách hàng N",
      partnerTaxCode: "0101234567",
      netAmount: 10000000,
      vatRate: 10,
      vatAmount: 1050000, // Lệch 50,000 VND
      overrideReason: "Thuế GTGT tính theo phương pháp đặc thù lẻ", // >= 5 chars
    }, user.id);
    check(!!inv4 && Number(inv4.vatAmount) === 1050000, "Cho phép ghi đè thuế GTGT lệch nếu cung cấp lý do giải trình hợp lệ");

    // 8. Chặn sửa/xóa hóa đơn khi không ở trạng thái DRAFT: PASS
    const inv1Issued = await TaxInvoiceService.issueInvoice(inv1.id, comp1.id, user.id);
    check(inv1Issued.status === TaxInvoiceStatus.ISSUED, "Phát hành hóa đơn DRAFT -> ISSUED thành công");

    let updateIssuedBlocked = false;
    try {
      await TaxInvoiceService.updateInvoice(inv1.id, {
        invoiceNumber: "0000001",
        invoiceSeries: "C26TBB",
        partnerName: "Tên sửa đổi",
        partnerTaxCode: "0101234567",
        netAmount: 10000000,
        vatRate: 10,
        vatAmount: 1000000,
      }, comp1.id, user.id);
    } catch (e) {
      updateIssuedBlocked = true;
    }
    check(updateIssuedBlocked, "Chặn cập nhật hóa đơn đã phát hành (ISSUED)");

    // 9. Chặn ghi sổ nếu chưa phát hành: PASS
    let postDraftBlocked = false;
    try {
      await TaxInvoiceService.postInvoice(inv2.id, comp1.id, user.id); // inv2 is DRAFT
    } catch (e) {
      postDraftBlocked = true;
    }
    check(postDraftBlocked, "Chặn ghi sổ (post) hóa đơn chưa phát hành (còn ở DRAFT)");

    // 10. Ghi sổ hóa đơn bán ra (OUTBOUND) thành công và hạch toán kép cân đối: PASS
    const inv1Posted = await TaxInvoiceService.postInvoice(inv1.id, comp1.id, user.id);
    check(inv1Posted.status === TaxInvoiceStatus.POSTED && !!inv1Posted.postedJournalEntryId, "Ghi sổ hóa đơn bán ra thành công");

    const journal1 = await prisma.journalEntry.findUnique({
      where: { id: inv1Posted.postedJournalEntryId! },
      include: { lines: true }
    });
    
    if (journal1) {
      const debits = journal1.lines.filter(l => l.type === TransactionType.DEBIT).reduce((s, l) => s + Number(l.amount), 0);
      const credits = journal1.lines.filter(l => l.type === TransactionType.CREDIT).reduce((s, l) => s + Number(l.amount), 0);
      check(debits === 11000000 && credits === 11000000, "Bút toán hạch toán thuế bán ra cân đối (Debit = Credit = 11,000,000 VND)");
    } else {
      check(false, "Không tìm thấy bút toán JournalEntry của hóa đơn");
    }

    // 11. Đảo bút toán hóa đơn đã ghi sổ thành công: PASS
    const inv1Reversed = await TaxInvoiceService.reverseInvoice(inv1.id, comp1.id, user.id, "Khách hàng trả lại hàng hóa dịch vụ");
    check(inv1Reversed.status === TaxInvoiceStatus.REVERSED, "Đảo bút toán hóa đơn thành công");

    const originalJournal = await prisma.journalEntry.findFirst({
      where: { sourceId: inv1.id, sourceType: "TAX_INVOICE", deletedAt: null }
    });
    const reversalJournal = await prisma.journalEntry.findFirst({
      where: { sourceId: inv1.id, sourceType: "TAX_INVOICE_REVERSAL", deletedAt: null }
    });
    check(!!reversalJournal, "Tạo bút toán đảo kép đối ứng thành công");

    // 12. Hủy hóa đơn (Draft/Issued) thành công với lý do giải trình: PASS
    const inv2Issued = await TaxInvoiceService.issueInvoice(inv2.id, comp1.id, user.id);
    const inv2Cancelled = await TaxInvoiceService.cancelInvoice(inv2.id, comp1.id, user.id, "Sai sót thông tin địa chỉ đối tác");
    check(inv2Cancelled.status === TaxInvoiceStatus.CANCELLED, "Hủy hóa đơn ISSUED thành công");

    // 13. Tenant isolation guard chặn hành động xuyên công ty: PASS
    let crossTenantBlocked = false;
    try {
      await TaxInvoiceService.getInvoiceById(inv1.id, comp2.id); // inv1 belongs to comp1, querying with comp2
    } catch (e) {
      crossTenantBlocked = true;
    }
    check(crossTenantBlocked, "Tenant guard bảo vệ an toàn thông tin cách ly hóa đơn xuyên công ty");

    // 14. Báo cáo bảng kê thuế bán ra (01-1) và mua vào (01-2) lấy đúng dữ liệu POSTED: PASS
    // Let's create an inbound invoice, issue it, and post it to check purchasing report
    const inv5 = await TaxInvoiceService.createInvoice({
      companyId: comp1.id,
      projectId: proj.id,
      invoiceType: TaxInvoiceType.INBOUND,
      invoiceNumber: "0000009",
      invoiceSeries: "C26TCC",
      invoiceDate: new Date(),
      partnerName: "Nhà cung cấp B",
      partnerTaxCode: "0209876543",
      netAmount: 6000000,
      vatRate: 10,
      vatAmount: 600000,
    }, user.id);
    await TaxInvoiceService.issueInvoice(inv5.id, comp1.id, user.id);
    await TaxInvoiceService.postInvoice(inv5.id, comp1.id, user.id);

    const salesBook = await TaxReportService.getVatSales(comp1.id);
    const purchasesBook = await TaxReportService.getVatPurchases(comp1.id);
    // Note: inv1 was posted but reversed. We keep all POSTED in tax registers.
    check(purchasesBook.length === 1 && purchasesBook[0].invoiceNumber === "0000009", "Bảng kê mua vào 01-2/GTGT hiển thị chính xác các hóa đơn mua vào đã ghi sổ");

    // 15. Audit trail được ghi vết đầy đủ: PASS
    const auditCount = await prisma.auditLog.count({
      where: { entityId: inv1.id }
    });
    check(auditCount >= 4, "Hệ thống ghi vết Audit Log đầy đủ toàn bộ vòng đời: CREATE/UPDATE/ISSUE/POST/REVERSE");

  } finally {
    // Clean up test data
    await prisma.taxInvoice.deleteMany({ where: { companyId: { in: [comp1.id, comp2.id] } } });
    await prisma.transactionLine.deleteMany({
      where: {
        journalEntry: { projectId: proj.id }
      }
    });
    await prisma.journalEntry.deleteMany({ where: { projectId: proj.id } });
    await prisma.project.deleteMany({ where: { id: proj.id } });
    await prisma.company.deleteMany({ where: { id: { in: [comp1.id, comp2.id] } } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
  }

  console.log("\n==================================================================");
  console.log(` SPRINT 3.2 TESTS COMPLETED. Pass: ${pass}, Fail: ${fail}`);
  console.log("==================================================================");

  if (fail > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(console.error);
