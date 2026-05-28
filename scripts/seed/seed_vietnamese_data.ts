import { PrismaClient, TransactionType } from "../../generated/prisma-client";
import { Decimal } from "decimal.js";
import { seedChartOfAccounts } from "../../lib/accounting/chartOfAccounts";

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU SEED DỮ LIỆU MẪU KẾ TOÁN XÂY DỰNG VIỆT NAM ===");

  // 1. Đảm bảo hệ thống tài khoản được seed trước
  console.log("1. Đang seed hệ thống tài khoản Thông tư 200...");
  await seedChartOfAccounts(prisma);
  console.log("✅ Hệ thống tài khoản đã được chuẩn hóa.");

  // 2. Tạo User làm việc (nếu chưa có)
  console.log("2. Đang kiểm tra người dùng...");
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
    console.log("✅ Đã tạo user quản trị mặc định.");
  } else {
    console.log(`✅ Người dùng đã tồn tại: ${user.name}`);
  }

  // 3. Tạo 3 Công trình (Project)
  console.log("3. Đang tạo các công trình xây dựng...");
  const projectsData = [
    {
      id: "project-landmark",
      name: "Dự án Chung cư Cao cấp Landmark Icon",
      contractValue: new Decimal(150000000000), // 150 tỷ
      totalBudget: new Decimal(120000000000),
      status: "ACTIVE"
    },
    {
      id: "project-caotoc",
      name: "Dự án Tuyến cao tốc Bắc-Nam Gói thầu XL-05",
      contractValue: new Decimal(500000000000), // 500 tỷ
      totalBudget: new Decimal(420000000000),
      status: "ACTIVE"
    },
    {
      id: "project-vinhtan",
      name: "Dự án Nhà máy Nhiệt điện Vĩnh Tân 4",
      contractValue: new Decimal(800000000000), // 800 tỷ
      totalBudget: new Decimal(680000000000),
      status: "ACTIVE"
    }
  ];

  const projects = [];
  for (const proj of projectsData) {
    const existing = await prisma.project.findFirst({ where: { name: proj.name } });
    if (!existing) {
      const p = await prisma.project.create({ data: proj });
      projects.push(p);
    } else {
      projects.push(existing);
    }
  }
  console.log(`✅ Đã seed ${projects.length} công trình.`);

  // Cần tạo một WBS Item cho mỗi công trình để thỏa mãn schema
  for (const p of projects) {
    const existingWbs = await prisma.wBSItem.findFirst({ where: { projectId: p.id } });
    if (!existingWbs) {
      await prisma.wBSItem.create({
        data: {
          id: `wbs-${p.id}`,
          projectId: p.id,
          name: "Hạng mục xây lắp tổng hợp",
          code: `HM-${p.id.slice(-4).toUpperCase()}`,
          budgetAmount: p.totalBudget || new Decimal(0),
          level: 1
        }
      });
    }
  }

  // 4. Tạo 5 Nhà cung cấp & 3 Chủ đầu tư (Khách hàng) trong bảng Supplier
  console.log("4. Đang tạo các đối tác (Nhà cung cấp & Chủ đầu tư)...");
  const suppliersData = [
    // 5 Nhà cung cấp (NCC)
    { id: "partner-hoaphat", code: "NCC-HOAPHAT", name: "Công ty Cổ phần Thép Hòa Phát Việt Nam", description: "Nhà cung cấp thép xây dựng" },
    { id: "partner-hatien", code: "NCC-HATIEN", name: "Tổng Công ty Xi măng Vicem Hà Tiên", description: "Nhà cung cấp xi măng" },
    { id: "partner-thuduc", code: "NCC-THUDUC", name: "Công ty TNHH Bê tông ly tâm Thủ Đức", description: "Nhà cung cấp bê tông tươi" },
    { id: "partner-hungcuong", code: "NCC-HUNGCUONG", name: "Hợp tác xã Nhân công và Xây dựng Hùng Cường", description: "Thầu phụ thi công xây lắp nhân công" },
    { id: "partner-minhphat", code: "NCC-MINHPHAT", name: "Công ty TNHH Thiết bị và Máy xây dựng Minh Phát", description: "Nhà thầu thuê máy thi công" },
    
    // 3 Chủ đầu tư (CĐT) - Khách hàng
    { id: "partner-vingroup", code: "CĐT-VINGROUP", name: "Tập đoàn Vingroup - Công ty CP", description: "Chủ đầu tư Landmark Icon" },
    { id: "partner-duongsat", code: "CĐT-DUONGSAT", name: "Ban Quản lý Dự án Đường sắt - Bộ GTVT", description: "Chủ đầu tư Tuyến cao tốc Bắc-Nam" },
    { id: "partner-evn", code: "CĐT-EVN3", name: "Tổng Công ty Phát điện 3 (EVNGENCO3)", description: "Chủ đầu tư Nhà máy Vĩnh Tân 4" }
  ];

  const partners = [];
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findUnique({ where: { code: s.code } });
    if (!existing) {
      const p = await prisma.supplier.create({ data: s });
      partners.push(p);
    } else {
      partners.push(existing);
    }
  }
  console.log(`✅ Đã seed ${partners.length} đối tác.`);

  // Liên kết nhà cung cấp vào công trình (ProjectSupplier)
  for (const p of projects) {
    for (const s of partners) {
      await prisma.projectSupplier.upsert({
        where: { projectId_supplierId: { projectId: p.id, supplierId: s.id } },
        create: { projectId: p.id, supplierId: s.id },
        update: {}
      });
    }
  }

  // 5. Tạo 5 Hợp đồng (Contract)
  console.log("5. Đang tạo các hợp đồng kinh tế...");
  const contractsData = [
    // 2 Hợp đồng ĐẦU RA (Thi công cho Chủ đầu tư)
    {
      id: "contract-landmark-vin",
      projectId: "project-landmark",
      supplierId: "partner-vingroup",
      contractCode: "123/2026/HĐ-VINGROUP",
      title: "Hợp đồng thi công xây dựng phần thân Landmark Icon",
      originalValue: new Decimal(150000000000), // 150 tỷ
      currentValue: new Decimal(150000000000),
      status: "ACTIVE"
    },
    {
      id: "contract-caotoc-bql",
      projectId: "project-caotoc",
      supplierId: "partner-duongsat",
      contractCode: "456/2026/HĐ-GTVT",
      title: "Hợp đồng xây lắp Gói thầu XL-05 cao tốc Bắc-Nam",
      originalValue: new Decimal(500000000000), // 500 tỷ
      currentValue: new Decimal(500000000000),
      status: "ACTIVE"
    },
    // 3 Hợp đồng ĐẦU VÀO (Mua nhà cung cấp / Thầu phụ)
    {
      id: "contract-landmark-steel",
      projectId: "project-landmark",
      supplierId: "partner-hoaphat",
      contractCode: "789/HĐ-HOAPHAT",
      title: "Hợp đồng mua thép xây dựng dự án Landmark",
      originalValue: new Decimal(150000000000), // 15 tỷ (Lưu ý: Schema dùng Decimal nên ta ghi đúng 15,000,000,000)
      currentValue: new Decimal(15000000000), // 15 tỷ
      status: "ACTIVE"
    },
    {
      id: "contract-caotoc-labor",
      projectId: "project-caotoc",
      supplierId: "partner-hungcuong",
      contractCode: "01/2026/HĐ-HUNGCUONG",
      title: "Hợp đồng giao khoán nhân công xây lắp thô",
      originalValue: new Decimal(8000000000), // 8 tỷ
      currentValue: new Decimal(8000000000),
      status: "ACTIVE"
    },
    {
      id: "contract-vinhtan-machine",
      projectId: "project-vinhtan",
      supplierId: "partner-minhphat",
      contractCode: "02/2026/HĐ-MINHPHAT",
      title: "Hợp đồng thuê máy cẩu chuyên dụng phục vụ lắp máy",
      originalValue: new Decimal(3500000000), // 3.5 tỷ
      currentValue: new Decimal(3500000000),
      status: "ACTIVE"
    }
  ];

  // Sửa lại giá trị gốc cho hợp đồng landmark steel
  contractsData[2].originalValue = new Decimal(15000000000);

  const contracts = [];
  for (const c of contractsData) {
    const existing = await prisma.contract.findFirst({ where: { contractCode: c.contractCode } });
    if (!existing) {
      const contract = await prisma.contract.create({ data: c });
      contracts.push(contract);
    } else {
      contracts.push(existing);
    }
  }
  console.log(`✅ Đã seed ${contracts.length} hợp đồng.`);

  // 6. Xóa các chứng từ cũ để đảm bảo tính đồng nhất dữ liệu seed mới
  console.log("6. Làm sạch các dòng hạch toán cũ để nạp số liệu mới...");
  await prisma.vendorPayment.deleteMany({});
  await prisma.transactionLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.acceptance.deleteMany({});
  await prisma.costRecord.deleteMany({});
  console.log("✅ Hệ thống hạch toán đã được làm trống sạch sẽ.");

  // Lấy danh sách ID tài khoản để hạch toán chuẩn
  const accounts = await prisma.ledgerAccount.findMany({});
  const accMap = new Map(accounts.map(a => [a.code, a.id]));

  // Lấy ID tài khoản hạch toán
  const tk1111 = accMap.get("1111")!;
  const tk1121 = accMap.get("1121")!;
  const tk131 = accMap.get("131")!;
  const tk133 = accMap.get("133")!;
  const tk141 = accMap.get("141")!;
  const tk152 = accMap.get("152")!;
  const tk331 = accMap.get("331")!;
  const tk333 = accMap.get("333")!;
  const tk334 = accMap.get("334")!;
  const tk511 = accMap.get("511")!;
  const tk621 = accMap.get("621")!;
  const tk622 = accMap.get("622")!;
  const tk623 = accMap.get("623")!;
  const tk627 = accMap.get("627")!;

  console.log("7. Bắt đầu sinh các giao dịch hạch toán mẫu tiếng Việt...");

  // --- NGHIỆP VỤ 1: CHỨNG TỪ TẠM ỨNG (Tạm ứng tiền mặt cho thầu phụ Hùng Cường)
  console.log("- Hạch toán tạm ứng thầu phụ Hùng Cường (1 tỷ VND)...");
  const p1 = await prisma.payment.create({
    data: {
      projectId: "project-caotoc",
      contractId: "contract-caotoc-labor",
      amount: new Decimal(1000000000), // 1 tỷ
      date: new Date("2026-04-01"),
      description: "Chi tạm ứng nhân công đợt 1 cho HTX Hùng Cường"
    }
  });

  const je1 = await prisma.journalEntry.create({
    data: {
      projectId: "project-caotoc",
      date: new Date("2026-04-01"),
      description: "Chi tạm ứng nhân công đợt 1 cho HTX Hùng Cường theo HĐ 01/2026",
      reference: "PTU-001",
      sourceType: "PAYMENT",
      sourceId: p1.id,
      status: "DA_GHI_SO",
      isPosted: true
    }
  });

  await prisma.transactionLine.createMany({
    data: [
      { journalEntryId: je1.id, accountId: tk141, amount: new Decimal(1000000000), type: "DEBIT", description: "Tạm ứng cho HTX Hùng Cường" },
      { journalEntryId: je1.id, accountId: tk1111, amount: new Decimal(1000000000), type: "CREDIT", description: "Chi tiền mặt tạm ứng" }
    ]
  });

  // --- NGHIỆP VỤ 2: CHỨNG TỪ CHI PHÍ VẬT TƯ (Nhập kho thép Hòa Phát cho dự án Landmark)
  console.log("- Hạch toán chi phí nguyên vật liệu thép Hòa Phát (5 tỷ chưa thuế)...");
  const cost1 = await prisma.costRecord.create({
    data: {
      projectId: "project-landmark",
      supplier: "partner-hoaphat",
      wbsId: "wbs-project-landmark",
      costType: "material",
      amount: new Decimal(5500000000), // 5.5 tỷ
      netAmount: new Decimal(5000000000), // 5 tỷ
      vatAmount: new Decimal(500000000),  // 500 triệu
      vatRate: 10,
      date: new Date("2026-04-10"),
      note: "Hóa đơn mua thép xây dựng đợt 1 - Hòa Phát"
    }
  });

  const je2 = await prisma.journalEntry.create({
    data: {
      projectId: "project-landmark",
      date: new Date("2026-04-10"),
      description: "Hóa đơn mua thép xây dựng đợt 1 từ Hòa Phát",
      reference: "HĐ-HP01",
      sourceType: "COST",
      sourceId: cost1.id,
      status: "DA_GHI_SO",
      isPosted: true
    }
  });

  await prisma.transactionLine.createMany({
    data: [
      { journalEntryId: je2.id, accountId: tk152, amount: new Decimal(5000000000), type: "DEBIT", description: "Nhập kho thép xây dựng" },
      { journalEntryId: je2.id, accountId: tk133, amount: new Decimal(500000000), type: "DEBIT", description: "Thuế GTGT đầu vào được khấu trừ" },
      { journalEntryId: je2.id, accountId: tk331, amount: new Decimal(5500000000), type: "CREDIT", description: "Phải trả cho thép Hòa Phát" }
    ]
  });

  // --- NGHIỆP VỤ 3: CHỨNG TỪ CHI PHÍ NHÂN CÔNG (Ghi nhận nhân công xây lắp cao tốc Bắc Nam)
  console.log("- Hạch toán chi phí nhân công HTX Hùng Cường (2 tỷ VND)...");
  const cost2 = await prisma.costRecord.create({
    data: {
      projectId: "project-caotoc",
      supplier: "partner-hungcuong",
      wbsId: "wbs-project-caotoc",
      costType: "labor",
      amount: new Decimal(2000000000),
      netAmount: new Decimal(2000000000),
      date: new Date("2026-04-20"),
      note: "Nghiệm thu khối lượng nhân công xây lắp đợt 1"
    }
  });

  const je3 = await prisma.journalEntry.create({
    data: {
      projectId: "project-caotoc",
      date: new Date("2026-04-20"),
      description: "Nghiệm thu khối lượng nhân công thô từ HTX Hùng Cường đợt 1",
      reference: "NC-HC01",
      sourceType: "COST",
      sourceId: cost2.id,
      status: "DA_GHI_SO",
      isPosted: true
    }
  });

  await prisma.transactionLine.createMany({
    data: [
      { journalEntryId: je3.id, accountId: tk622, amount: new Decimal(2000000000), type: "DEBIT", description: "Chi phí nhân công trực tiếp công trình" },
      { journalEntryId: je3.id, accountId: tk331, amount: new Decimal(2000000000), type: "CREDIT", description: "Phải trả nhân công HTX Hùng Cường" }
    ]
  });

  // --- NGHIỆP VỤ 4: CHỨNG TỪ NGHIỆM THU / DOANH THU (Nghiệm thu Landmark cho Vingroup)
  console.log("- Hạch toán nghiệm thu doanh thu đợt 1 dự án Landmark với Vingroup (30 tỷ chưa thuế)...");
  const inv1 = await prisma.invoice.create({
    data: {
      projectId: "project-landmark",
      contractId: "contract-landmark-vin",
      wbsId: "wbs-project-landmark",
      invoiceNumber: "INV-VIN01",
      amount: new Decimal(33000000000),   // 33 tỷ
      netAmount: new Decimal(30000000000),// 30 tỷ
      vatAmount: new Decimal(3000000000),  // 3 tỷ
      vatRate: 10,
      issuedDate: new Date("2026-05-01"),
      remainingAmount: new Decimal(33000000000),
      status: "SENT"
    }
  });

  const je4 = await prisma.journalEntry.create({
    data: {
      projectId: "project-landmark",
      date: new Date("2026-05-01"),
      description: "Doanh thu nghiệm thu phần móng Landmark Icon với Vingroup",
      reference: "INV-VIN01",
      sourceType: "INVOICE",
      sourceId: inv1.id,
      status: "DA_GHI_SO",
      isPosted: true
    }
  });

  await prisma.transactionLine.createMany({
    data: [
      { journalEntryId: je4.id, accountId: tk131, amount: new Decimal(33000000000), type: "DEBIT", description: "Phải thu khách hàng Vingroup" },
      { journalEntryId: je4.id, accountId: tk511, amount: new Decimal(30000000000), type: "CREDIT", description: "Doanh thu bán hàng và cung cấp dịch vụ" },
      { journalEntryId: je4.id, accountId: tk333, amount: new Decimal(3000000000), type: "CREDIT", description: "Thuế GTGT phải nộp Nhà nước" }
    ]
  });

  // --- NGHIỆP VỤ 5: CHỨNG TỪ THANH TOÁN (Vingroup thanh toán đợt 1 bằng chuyển khoản ngân hàng)
  console.log("- Hạch toán nhận tiền thanh toán từ Vingroup (20 tỷ VND)...");
  const pay1 = await prisma.payment.create({
    data: {
      projectId: "project-landmark",
      contractId: "contract-landmark-vin",
      invoiceId: inv1.id,
      amount: new Decimal(20000000000), // 20 tỷ
      date: new Date("2026-05-15"),
      description: "Thu tiền chuyển khoản thanh toán khối lượng đợt 1 từ Vingroup"
    }
  });

  // Cập nhật lại số tiền đã thanh toán của hóa đơn
  await prisma.invoice.update({
    where: { id: inv1.id },
    data: {
      paidAmount: new Decimal(20000000000),
      remainingAmount: new Decimal(13000000000),
      status: "PARTIAL"
    }
  });

  const je5 = await prisma.journalEntry.create({
    data: {
      projectId: "project-landmark",
      date: new Date("2026-05-15"),
      description: "Thu tiền chuyển khoản đợt 1 từ Vingroup",
      reference: "PTT-001",
      sourceType: "PAYMENT",
      sourceId: pay1.id,
      status: "DA_GHI_SO",
      isPosted: true
    }
  });

  await prisma.transactionLine.createMany({
    data: [
      { journalEntryId: je5.id, accountId: tk1121, amount: new Decimal(20000000000), type: "DEBIT", description: "Tiền gửi ngân hàng thu từ Vingroup" },
      { journalEntryId: je5.id, accountId: tk131, amount: new Decimal(20000000000), type: "CREDIT", description: "Giảm phải thu từ Vingroup" }
    ]
  });

  console.log("=== HOÀN THÀNH SEED DỮ LIỆU MẪU KẾ TOÁN XÂY DỰNG THÀNH CÔNG ===");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
