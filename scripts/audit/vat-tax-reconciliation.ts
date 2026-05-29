import { PrismaClient, TaxInvoiceStatus, TaxInvoiceType, TransactionType } from "../../generated/prisma-client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================================");
  console.log("    HỆ THỐNG KIỂM TRA ĐỐI CHIẾU THUẾ GTGT (VAT RECONCILIATION)");
  console.log("==================================================================");

  try {
    // 1. Calculate totals from Tax Invoice Registry (Sổ đăng ký hóa đơn VAT)
    const registrySales = await prisma.taxInvoice.aggregate({
      where: { invoiceType: TaxInvoiceType.OUTBOUND, status: TaxInvoiceStatus.POSTED, deletedAt: null },
      _sum: { netAmount: true, vatAmount: true, grossAmount: true },
      _count: true,
    });

    const registryPurchases = await prisma.taxInvoice.aggregate({
      where: { invoiceType: TaxInvoiceType.INBOUND, status: TaxInvoiceStatus.POSTED, deletedAt: null },
      _sum: { netAmount: true, vatAmount: true, grossAmount: true },
      _count: true,
    });

    const regSalesNet = Number(registrySales._sum.netAmount || 0);
    const regSalesVat = Number(registrySales._sum.vatAmount || 0);
    const regPurchasesNet = Number(registryPurchases._sum.netAmount || 0);
    const regPurchasesVat = Number(registryPurchases._sum.vatAmount || 0);

    console.log("\n[1] TỔNG HỢP TỪ SỔ ĐĂNG KÝ HÓA ĐƠN VAT (REGISTRY):");
    console.log(`  - Hóa đơn Bán ra (Output): ${registrySales._count} HĐ`);
    console.log(`    + Doanh thu chưa thuế (Net): ${regSalesNet.toLocaleString()} VND`);
    console.log(`    + Thuế GTGT đầu ra (VAT):   ${regSalesVat.toLocaleString()} VND`);
    console.log(`  - Hóa đơn Mua vào (Input):  ${registryPurchases._count} HĐ`);
    console.log(`    + Chi phí chưa thuế (Net):   ${regPurchasesNet.toLocaleString()} VND`);
    console.log(`    + Thuế GTGT đầu vào (VAT):   ${regPurchasesVat.toLocaleString()} VND`);

    // 2. Fetch totals from General Ledger (Sổ cái tài khoản 1331 và 33311)
    // Find account IDs
    const acc1331 = await prisma.ledgerAccount.findFirst({ where: { code: "1331" } });
    const acc33311 = await prisma.ledgerAccount.findFirst({ where: { code: "33311" } });

    if (!acc1331 || !acc33311) {
      console.warn("⚠️ CẢNH BÁO: Không tìm thấy mã tài khoản hệ thống 1331 hoặc 33311 trong Danh mục tài khoản.");
    }

    const ledgerInputVat = await prisma.transactionLine.aggregate({
      where: {
        accountId: acc1331?.id,
        journalEntry: { isPosted: true, deletedAt: null },
      },
      _sum: { amount: true },
    });

    const ledgerOutputVat = await prisma.transactionLine.aggregate({
      where: {
        accountId: acc33311?.id,
        journalEntry: { isPosted: true, deletedAt: null },
      },
      _sum: { amount: true },
    });

    const ledInputTotal = Number(ledgerInputVat._sum.amount || 0);
    const ledOutputTotal = Number(ledgerOutputVat._sum.amount || 0);

    console.log("\n[2] TỔNG HỢP TỪ SỔ CÁI KẾ TOÁN (GENERAL LEDGER):");
    console.log(`  - Số phát sinh Nợ TK 1331 (Thuế đầu vào):  ${ledInputTotal.toLocaleString()} VND`);
    console.log(`  - Số phát sinh Có TK 33311 (Thuế đầu ra): ${ledOutputTotal.toLocaleString()} VND`);

    // 3. Perform Reconciliation (Đối chiếu số dư và phát sinh)
    const salesDiff = Math.abs(regSalesVat - ledOutputTotal);
    const purchaseDiff = Math.abs(regPurchasesVat - ledInputTotal);

    console.log("\n[3] KẾT QUẢ ĐỐI CHIẾU CHÊNH LỆCH (RECONCILIATION DIFFERENCES):");
    if (salesDiff === 0) {
      console.log("  ✓ Thuế GTGT đầu ra (33311): KHỚP 100% (Chênh lệch: 0 VND)");
    } else {
      console.error(`  ❌ LỆCH THUẾ ĐẦU RA: Sổ đăng ký (${regSalesVat.toLocaleString()}) khác Sổ cái (${ledOutputTotal.toLocaleString()}). Chênh lệch: ${salesDiff.toLocaleString()} VND!`);
    }

    if (purchaseDiff === 0) {
      console.log("  ✓ Thuế GTGT đầu vào (1331):  KHỚP 100% (Chênh lệch: 0 VND)");
    } else {
      console.error(`  ❌ LỆCH THUẾ ĐẦU VÀO: Sổ đăng ký (${regPurchasesVat.toLocaleString()}) khác Sổ cái (${ledInputTotal.toLocaleString()}). Chênh lệch: ${purchaseDiff.toLocaleString()} VND!`);
    }

    // 4. Scan for Orphan / Anomalous Entries
    console.log("\n[4] QUÉT LỖI BẤT THƯỜNG / CHỨNG TỪ MỒ CÔI (ORPHAN SCANS):");
    
    // Scenario A: Posted Tax Invoices without matched Journal Entries
    const orphanInvoices = await prisma.taxInvoice.findMany({
      where: {
        status: TaxInvoiceStatus.POSTED,
        postedJournalEntryId: null,
        deletedAt: null,
      },
      select: { id: true, invoiceNumber: true, invoiceSeries: true, partnerName: true },
    });

    if (orphanInvoices.length > 0) {
      console.error(`  ❌ Phát hiện ${orphanInvoices.length} hóa đơn mồ côi (Trạng thái POSTED nhưng không có liên kết JournalEntry):`);
      for (const inv of orphanInvoices) {
        console.error(`    - HĐ số ${inv.invoiceNumber}, Ký hiệu ${inv.invoiceSeries} - ${inv.partnerName} (ID: ${inv.id})`);
      }
    } else {
      console.log("  ✓ Không phát hiện hóa đơn mồ côi không có bút toán.");
    }

    // Scenario B: Journal Entries matching TAX_INVOICE source but referenced Invoice is missing
    const taxJournals = await prisma.journalEntry.findMany({
      where: { sourceType: "TAX_INVOICE", deletedAt: null },
      select: { id: true, sourceId: true, reference: true },
    });

    const activeInvoiceIds = new Set((await prisma.taxInvoice.findMany({ where: { deletedAt: null }, select: { id: true } })).map(i => i.id));
    const orphanJournals = taxJournals.filter(j => j.sourceId && !activeInvoiceIds.has(j.sourceId));

    if (orphanJournals.length > 0) {
      console.error(`  ❌ Phát hiện ${orphanJournals.length} bút toán mồ côi (Mã nguồn TAX_INVOICE nhưng không tìm thấy Hóa đơn tương ứng):`);
      for (const j of orphanJournals) {
        console.error(`    - Bút toán ID: ${j.id}, Tham chiếu: ${j.reference}, Hóa đơn nguồn ID: ${j.sourceId}`);
      }
    } else {
      console.log("  ✓ Không phát hiện bút toán mồ côi mất hóa đơn nguồn.");
    }

    console.log("\n==================================================================");
    if (salesDiff === 0 && purchaseDiff === 0 && orphanInvoices.length === 0 && orphanJournals.length === 0) {
      console.log("  🏆 HỆ THỐNG ĐẠT TRẠNG THÁI HOÀN TOÀN KHỚP VÀ AN TOÀN!");
    } else {
      console.warn("  ⚠️ PHÁT HIỆN LỆCH HẠCH TOÁN THUẾ. ĐỀ NGHỊ KIỂM TRA LẠI CÁC CHỨNG TỪ GỐC.");
    }
    console.log("==================================================================");

  } catch (err: any) {
    console.error("Lỗi thực thi đối chiếu:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
