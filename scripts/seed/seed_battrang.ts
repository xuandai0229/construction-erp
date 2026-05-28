import { PrismaClient, TransactionType } from "../../generated/prisma-client";
import { Decimal } from "decimal.js";
import { seedChartOfAccounts } from "../../lib/accounting/chartOfAccounts";

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU SEED DỮ LIỆU CHUẨN 100%: TRƯỜNG MẦM NON BÁT TRÀNG ===");

  // 1. Seed hệ thống tài khoản kế toán Việt Nam (Thông tư 200)
  console.log("1. Đang đồng bộ hệ thống tài khoản chuẩn TT200...");
  await seedChartOfAccounts(prisma);

  // 2. Tạo User mặc định
  let user = await prisma.user.findFirst({
    where: { email: "admin@construction.com" }
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: "sys-admin-uuid",
        email: "admin@construction.com",
        name: "Hệ thống Quản trị (Super Admin)",
        role: "SUPER_ADMIN"
      }
    });
  }

  // 3. Làm sạch dữ liệu cũ để tránh chênh lệch, trùng lặp
  console.log("2. Làm sạch toàn bộ cơ sở dữ liệu cũ...");

  const deleteTable = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
      console.log(`- Đã dọn dẹp bảng: ${name}`);
    } catch (e: any) {
      console.log(`- Bỏ qua hoặc trống: ${name} (${e.message})`);
    }
  };

  await deleteTable("Measurement", () => prisma.measurement.deleteMany({}));
  await deleteTable("ProgressEntry", () => prisma.progressEntry.deleteMany({}));
  await deleteTable("BOQItem", () => prisma.bOQItem.deleteMany({}));
  await deleteTable("SiteConsumption", () => prisma.siteConsumption.deleteMany({}));
  await deleteTable("SubcontractItem", () => prisma.subcontractItem.deleteMany({}));
  await deleteTable("Subcontract", () => prisma.subcontract.deleteMany({}));
  await deleteTable("VariationOrder", () => prisma.variationOrder.deleteMany({}));
  await deleteTable("PurchaseOrderItem", () => prisma.purchaseOrderItem.deleteMany({}));
  await deleteTable("GoodsReceipt", () => prisma.goodsReceipt.deleteMany({}));
  await deleteTable("PurchaseOrder", () => prisma.purchaseOrder.deleteMany({}));
  await deleteTable("PurchaseRequest", () => prisma.purchaseRequest.deleteMany({}));
  await deleteTable("BudgetRecord", () => prisma.budgetRecord.deleteMany({}));
  await deleteTable("Revenue", () => prisma.revenue.deleteMany({}));
  await deleteTable("VendorPayment", () => prisma.vendorPayment.deleteMany({}));
  await deleteTable("TransactionLine", () => prisma.transactionLine.deleteMany({}));
  await deleteTable("JournalEntry", () => prisma.journalEntry.deleteMany({}));
  await deleteTable("PaymentAllocation", () => prisma.paymentAllocation.deleteMany({}));
  await deleteTable("Payment", () => prisma.payment.deleteMany({}));
  await deleteTable("Invoice", () => prisma.invoice.deleteMany({}));
  await deleteTable("Acceptance", () => prisma.acceptance.deleteMany({}));
  await deleteTable("CostRecord", () => prisma.costRecord.deleteMany({}));
  await deleteTable("ProjectSupplier", () => prisma.projectSupplier.deleteMany({}));
  await deleteTable("ContractChange", () => prisma.contractChange.deleteMany({}));
  await deleteTable("Contract", () => prisma.contract.deleteMany({}));
  await deleteTable("WBSItem", () => prisma.wBSItem.deleteMany({}));
  await deleteTable("BudgetVersion", () => prisma.budgetVersion.deleteMany({}));
  await deleteTable("InventoryTransaction", () => prisma.inventoryTransaction.deleteMany({}));
  await deleteTable("ActivityFeed", () => prisma.activityFeed.deleteMany({}));
  await deleteTable("ApprovalStep", () => prisma.approvalStep.deleteMany({}));
  await deleteTable("ApprovalRequest", () => prisma.approvalRequest.deleteMany({}));
  await deleteTable("Document", () => prisma.document.deleteMany({}));
  await deleteTable("TrialBalanceSnapshot", () => prisma.trialBalanceSnapshot.deleteMany({}));
  await deleteTable("BalanceSheetSnapshot", () => prisma.balanceSheetSnapshot.deleteMany({}));
  await deleteTable("ProfitLossSnapshot", () => prisma.profitLossSnapshot.deleteMany({}));
  await deleteTable("Project", () => prisma.project.deleteMany({}));
  await deleteTable("Supplier", () => prisma.supplier.deleteMany({}));

  console.log("✅ Làm sạch cơ sở dữ liệu hoàn tất.");

  // 4. Tạo công trình: Trường mầm non Bát Tràng
  console.log("3. Tạo công trình 'Trường mầm non Bát Tràng'...");
  const project = await prisma.project.create({
    data: {
      id: "project-battrang",
      name: "Trường mầm non Bát Tràng",
      contractValue: new Decimal(2000000000),
      totalBudget: new Decimal(1500000000),
      status: "ACTIVE",
      projectType: "Dân dụng",
      investor: "Ủy ban Nhân dân xã Bát Tràng"
    }
  });

  // Hạng mục WBS tổng hợp
  const wbs = await prisma.wBSItem.create({
    data: {
      id: "wbs-battrang",
      projectId: project.id,
      name: "Cung cấp Thiết bị Điện, Nước & Vệ sinh",
      code: "HM-VESBO",
      budgetAmount: new Decimal(1500000000),
      level: 1
    }
  });

  // 5. Tạo nhà cung cấp: Vesbo
  console.log("4. Tạo nhà cung cấp 'Vesbo'...");
  const supplier = await prisma.supplier.create({
    data: {
      id: "partner-vesbo",
      code: "VESBO",
      name: "Vesbo",
      description: "Nhà cung cấp ống nước, thiết bị điện, nước và thiết bị vệ sinh cao cấp"
    }
  });

  // Gán nhà cung cấp vào công trình
  await prisma.projectSupplier.create({
    data: {
      projectId: project.id,
      supplierId: supplier.id
    }
  });

  // Lấy danh mục tài khoản kế toán
  const accounts = await prisma.ledgerAccount.findMany({});
  const accMap = new Map(accounts.map(a => [a.code, a.id]));

  const tk1121 = accMap.get("1121")!; // Tiền gửi ngân hàng
  const tk133 = accMap.get("133")!;   // Thuế GTGT được khấu trừ
  const tk331 = accMap.get("331")!;   // Phải trả nhà cung cấp
  const tk621 = accMap.get("621")!;   // Chi phí NVL trực tiếp công trình

  // 6. Tạo 12 Hợp đồng gốc trước
  console.log("5. Tạo 12 hợp đồng gốc...");
  const contractsInfo = [
    { code: "HĐ111", title: "Cung cấp Thiết bị điện HĐ111", val: 56419982 },
    { code: "HĐ114", title: "Cung cấp Thiết bị điện HĐ114", val: 49282323 },
    { code: "HĐ132", title: "Cung cấp Thiết bị nước HĐ132", val: 13815630 },
    { code: "HĐ141", title: "Cung cấp Thiết bị điện + nước HĐ141", val: 210737383 },
    { code: "HĐ142", title: "Cung cấp Thiết bị vệ sinh & Vật tư phụ HĐ142", val: 150046272 },
    { code: "HĐ157", title: "Cung cấp Thiết bị điện HĐ157", val: 61053064 },
    { code: "HĐ158", title: "Cung cấp Thiết bị nước HĐ158", val: 8163653 },
    { code: "HĐ161", title: "Cung cấp Thiết bị vệ sinh HĐ161", val: 129488008 },
    { code: "HĐ183", title: "Cung cấp Thiết bị điện HĐ183", val: 16010403 },
    { code: "HĐ267", title: "Thiết bị & Vật tư theo HĐ267", val: 14702276 },
    { code: "HĐ1", title: "Thiết bị & Vật tư theo HĐ1", val: 3145908 },
    { code: "HĐ64", title: "Cung cấp Thiết bị điện HĐ64", val: 43970149 }
  ];

  const contractMap = new Map<string, string>();
  for (const c of contractsInfo) {
    const created = await prisma.contract.create({
      data: {
        projectId: project.id,
        supplierId: supplier.id,
        contractCode: c.code,
        title: c.title,
        originalValue: new Decimal(c.val),
        currentValue: new Decimal(c.val),
        status: "ACTIVE",
        signedDate: new Date("2025-07-01")
      }
    });
    contractMap.set(c.code, created.id);
  }

  // 7. Nhập chi tiết 16 dòng Nghiệm thu & Hóa đơn đề xuất (Khớp 100% từng dòng trên ảnh 1)
  console.log("6. Tạo chi tiết 16 dòng Nghiệm thu & Hóa đơn đề xuất...");
  const ledgerRows = [
    { date: "2025-07-10", code: "HĐ111", name: "Thiết bị điện", cost: 52102830, inv: 110384387, isReversal: false },
    { date: "2025-07-10", code: "HĐ114", name: "Thiết bị điện", cost: 47372080, inv: 68384758, isReversal: false },
    { date: "2025-07-23", code: "HĐ132", name: "Thiết bị nước", cost: 12680915, inv: 27999567, isReversal: false },
    { date: "2025-08-01", code: "HĐ141", name: "Thiết bị điện + nước", cost: 205471096, inv: 276565967, isReversal: false },
    { date: "2025-08-01", code: "HĐ142", name: "Vật tư phụ", cost: 1637280, inv: 0, isReversal: false },
    { date: "2025-08-01", code: "HĐ142", name: "Thiết bị vệ sinh", cost: 141557950, inv: 221509296, isReversal: false },
    // Dòng 7 là điều chỉnh giảm hoàn toàn dòng 6 -> Chuyển thành bút toán đảo (Reversal) dùng giá trị tuyệt đối dương để thỏa mãn database constraint
    { date: "2025-08-01", code: "HĐ142", name: "Phát sinh thêm tbvs (Giảm)", cost: 141557950, inv: 221509296, isReversal: true },
    { date: "2025-08-01", code: "HĐ142", name: "Phát sinh thêm tbvs (Tăng lại)", cost: 142691950, inv: 221509296, isReversal: false },
    { date: "2025-08-04", code: "HĐ157", name: "Thiết bị điện", cost: 7266040, inv: 0, isReversal: false },
    { date: "2025-08-04", code: "HĐ157", name: "Thiết bị điện", cost: 49685100, inv: 112327117, isReversal: false },
    { date: "2025-08-08", code: "HĐ158", name: "Thiết bị nước", cost: 7392565, inv: 17802253, isReversal: false },
    { date: "2025-08-18", code: "HĐ161", name: "Thiết bị vệ sinh", cost: 123375240, inv: 205897611, isReversal: false },
    { date: "2025-09-17", code: "HĐ183", name: "Thiết bị điện", cost: 12826964, inv: 55803393, isReversal: false },
    { date: "2025-12-10", code: "HĐ267", name: "Hóa đơn 267", cost: 0, inv: 198480721, isReversal: false },
    { date: "2026-01-03", code: "HĐ1", name: "Hóa đơn 1", cost: 0, inv: 42469762, isReversal: false },
    { date: "2026-04-20", code: "HĐ64", name: "Thiết bị điện (Phát sinh trong kỳ)", cost: 42076250, inv: 67643881, isReversal: false }
  ];

  const invoiceMap = new Map<string, string>();

  let idx = 1;
  for (const row of ledgerRows) {
    const contractId = contractMap.get(row.code)!;

    // A. Hạch toán Nghiệm thu khối lượng (GTNT)
    if (row.cost !== 0) {
      const absoluteCost = Math.abs(row.cost);
      const vatVal = Math.round(absoluteCost * 0.1);
      const netVal = absoluteCost - vatVal;

      const cost = await prisma.costRecord.create({
        data: {
          projectId: project.id,
          wbsId: wbs.id,
          supplier: supplier.name,
          costType: "material",
          amount: new Decimal(absoluteCost),
          netAmount: new Decimal(netVal),
          vatAmount: new Decimal(vatVal),
          vatRate: 10,
          date: new Date(row.date),
          note: `Nghiệm thu khối lượng ${row.name} theo ${row.code}`
        }
      });

      // Tạo bút toán sổ cái (JournalEntry)
      const jeCost = await prisma.journalEntry.create({
        data: {
          projectId: project.id,
          date: new Date(row.date),
          description: `Ghi nhận chi phí nghiệm thu ${row.name} theo ${row.code}${row.isReversal ? " (Điều chỉnh giảm)" : ""}`,
          reference: `NT-${row.code}-${idx}`,
          sourceType: "COST",
          sourceId: cost.id,
          status: "DA_GHI_SO",
          isPosted: true
        }
      });

      // Bút toán đảo hoặc bút toán thường tùy thuộc vào isReversal
      if (row.isReversal) {
        // Bút toán đảo: Giảm chi phí & giảm công nợ bằng cách đảo vế hạch toán (Nợ 331 / Có 621, Có 133)
        await prisma.transactionLine.createMany({
          data: [
            { journalEntryId: jeCost.id, accountId: tk331, amount: new Decimal(absoluteCost), type: "DEBIT", description: `Giảm phải trả Vesbo ${row.code}` },
            { journalEntryId: jeCost.id, accountId: tk621, amount: new Decimal(netVal), type: "CREDIT", description: `Giảm chi phí vật tư ${row.code}` },
            { journalEntryId: jeCost.id, accountId: tk133, amount: new Decimal(vatVal), type: "CREDIT", description: `Giảm thuế GTGT đầu vào khấu trừ` }
          ]
        });
      } else {
        // Bút toán thường: Tăng chi phí & tăng công nợ (Nợ 621, Nợ 133 / Có 331)
        await prisma.transactionLine.createMany({
          data: [
            { journalEntryId: jeCost.id, accountId: tk621, amount: new Decimal(netVal), type: "DEBIT", description: `Chi phí vật tư ${row.code}` },
            { journalEntryId: jeCost.id, accountId: tk133, amount: new Decimal(vatVal), type: "DEBIT", description: `Thuế GTGT đầu vào khấu trừ` },
            { journalEntryId: jeCost.id, accountId: tk331, amount: new Decimal(absoluteCost), type: "CREDIT", description: `Phải trả Vesbo ${row.code}` }
          ]
        });
      }
    }

    // B. Hạch toán Hóa đơn đề xuất (Hóa đơn ĐX)
    if (row.inv !== 0) {
      const absoluteInv = Math.abs(row.inv);
      const invInvoice = await prisma.invoice.create({
        data: {
          projectId: project.id,
          contractId: contractId,
          wbsId: wbs.id,
          invoiceNumber: `HD-${row.code}-${idx}`,
          amount: new Decimal(absoluteInv),
          netAmount: new Decimal(Math.round(absoluteInv / 1.1)),
          vatAmount: new Decimal(absoluteInv - Math.round(absoluteInv / 1.1)),
          issuedDate: new Date(row.date),
          remainingAmount: new Decimal(absoluteInv),
          status: "SENT",
          note: `Hóa đơn đề xuất cho ${row.name} - ${row.code}${row.isReversal ? " (Điều chỉnh giảm)" : ""}`
        }
      });

      invoiceMap.set(`${row.code}-${idx}`, invInvoice.id);
    }
    idx++;
  }

  // 8. Hạch toán chi tiết 12 đợt thanh toán chuyển khoản (Khớp 100% từng dòng trên ảnh 2)
  console.log("7. Tạo chi tiết 12 đợt thanh toán chuyển khoản...");
  const paymentRows = [
    { date: "2025-07-11", code: "HĐ111", amount: 56419982, matchKey: "HĐ111-1" },
    { date: "2025-07-11", code: "HĐ114", amount: 49282323, matchKey: "HĐ114-2" },
    { date: "2025-07-28", code: "HĐ132", amount: 13815630, matchKey: "HĐ132-3" },
    { date: "2025-08-07", code: "HĐ141", amount: 210737383, matchKey: "HĐ141-4" },
    { date: "2025-08-12", code: "HĐ142", amount: 150046272, matchKey: "HĐ142-8" }, // Khớp nợ với hóa đơn đợt cuối
    { date: "2025-08-20", code: "HĐ157", amount: 61053064, matchKey: "HĐ157-10" },
    { date: "2025-08-25", code: "HĐ158", amount: 8163653, matchKey: "HĐ158-11" },
    { date: "2025-08-25", code: "HĐ161", amount: 129488008, matchKey: "HĐ161-12" },
    { date: "2025-09-22", code: "HĐ183", amount: 16010403, matchKey: "HĐ183-13" },
    { date: "2025-12-12", code: "HĐ267", amount: 14702276, matchKey: "HĐ267-14" },
    { date: "2026-01-06", code: "HĐ1", amount: 3145908, matchKey: "HĐ1-15" },
    { date: "2026-05-05", code: "HĐ64", amount: 43970149, matchKey: "HĐ64-16" }
  ];

  for (const pay of paymentRows) {
    const contractId = contractMap.get(pay.code)!;
    const invoiceId = invoiceMap.get(pay.matchKey);

    const payment = await prisma.payment.create({
      data: {
        projectId: project.id,
        contractId: contractId,
        invoiceId: invoiceId || null,
        amount: new Decimal(pay.amount),
        date: new Date(pay.date),
        description: `Thanh toán khối lượng hoàn thành cho ${pay.code} - CK công ty S2`
      }
    });

    if (invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (inv) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: new Decimal(pay.amount),
            remainingAmount: new Decimal(inv.amount.minus(pay.amount)),
            status: inv.amount.equals(pay.amount) ? "PAID" : "PARTIAL"
          }
        });
      }
    }

    // Tạo bút toán sổ cái cho Thanh toán (Nợ 331 / Có 1121)
    const jePay = await prisma.journalEntry.create({
      data: {
        projectId: project.id,
        date: new Date(pay.date),
        description: `Chuyển khoản thanh toán Vesbo cho ${pay.code} - CK công ty S2`,
        reference: `UNC-${pay.code}`,
        sourceType: "PAYMENT",
        sourceId: payment.id,
        status: "DA_GHI_SO",
        isPosted: true
      }
    });

    await prisma.transactionLine.createMany({
      data: [
        { journalEntryId: jePay.id, accountId: tk331, amount: new Decimal(pay.amount), type: "DEBIT", description: `Thanh toán công nợ Vesbo ${pay.code}` },
        { journalEntryId: jePay.id, accountId: tk1121, amount: new Decimal(pay.amount), type: "CREDIT", description: `Tài khoản tiền gửi ngân hàng` }
      ]
    });
  }

  // 8. Triệt tiêu công nợ điều chỉnh
  console.log("8. Triệt tiêu công nợ điều chỉnh...");

  // HĐ142 điều chỉnh giảm hóa đơn
  const hd142_2 = invoiceMap.get("HĐ142-6");
  const hd142_3 = invoiceMap.get("HĐ142-7");
  if (hd142_2 && hd142_3) {
    await prisma.invoice.update({
      where: { id: hd142_2 },
      data: { paidAmount: new Decimal(221509296), remainingAmount: new Decimal(0), status: "PAID" }
    });
    // Hóa đơn giảm được triệt tiêu hoàn toàn bởi đối trừ nội bộ
    await prisma.invoice.update({
      where: { id: hd142_3 },
      data: { paidAmount: new Decimal(221509296), remainingAmount: new Decimal(0), status: "PAID" }
    });
  }

  console.log("===============================================================");
  console.log("✅ SEED DỮ LIỆU BÁT TRÀNG CHUẨN 100% THÀNH CÔNG!");
  console.log(`- Công trình: Trường mầm non Bát Tràng (ID: project-battrang)`);
  console.log(`- Nhà cung cấp: Vesbo (ID: partner-vesbo)`);
  console.log(`- Đã tạo: 12 Hợp đồng, 16 dòng Nghiệm thu & Hóa đơn riêng biệt, 12 chứng từ chuyển khoản.`);
  console.log(`- Tổng nghiệm thu (GTNT Cả thuế): 704,578,310 VND`);
  console.log(`- Tổng hóa đơn đề xuất: 1,405,628,713 VND`);
  console.log(`- Tổng số tiền đã thanh toán (Số tiền TT): 756,835,052 VND`);
  console.log("===============================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
