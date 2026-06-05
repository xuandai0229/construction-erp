import { randomUUID } from "node:crypto";
import { PrismaClient, AccountType, ApprovalStatus, CashBankDocumentStatus, CashBankDocumentType, ContractStatus, CostType, InventoryDocumentStatus, InventoryDocumentType, InvoiceStatus, ProjectStatus, SettlementStatus, TaxInvoiceStatus, TaxInvoiceType, TransactionType } from "../../generated/prisma-client";
import { PostingEngine } from "../../lib/accounting/postingEngine";

const prisma = new PrismaClient();

const MARKERS = [
  "SANDBOX_SEED_DATA",
  "SCHOOL_PROJECT_TEST_DATA",
  "NOT_FOR_PRODUCTION",
  "DO_NOT_USE_FOR_REAL_ACCOUNTING",
  "SEED_SCHOOL_CONSTRUCTION_PROJECT",
].join(" | ");

function requireEnv(name: string, expected?: string) {
  const value = process.env[name];
  if (!value || (expected && value !== expected)) {
    throw new Error(`Missing required guard ${name}${expected ? `=${expected}` : ""}`);
  }
  return value;
}

function assertLocalDatabase() {
  requireEnv("ALLOW_SANDBOX_RESET", "true");
  requireEnv("REQUIRE_LOCAL_DATABASE", "true");
  requireEnv("SEED_NAME", "SEED_SCHOOL_CONSTRUCTION_PROJECT");

  const raw = requireEnv("DATABASE_URL");
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  const dbName = url.pathname.replace(/^\//, "");
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
  const prodLike = /(prod|production|live)/i.test(raw) || /(prod|production|live)/i.test(dbName);

  if (!isLocal || prodLike) {
    throw new Error("BLOCKED_PRODUCTION_RISK");
  }
}

async function resetBusinessTables() {
  const tables = [
    "InventoryMovement",
    "InventoryDocumentLine",
    "InventoryDocument",
    "InventoryBalance",
    "TaxInvoice",
    "CashBankDocument",
    "AdvanceSettlement",
    "AdvanceRequest",
    "PaymentAllocation",
    "Payment",
    "Revenue",
    "Invoice",
    "TransactionLine",
    "JournalEntry",
    "CostRecord",
    "BudgetRecord",
    "BOQItem",
    "ProgressEntry",
    "ProjectSupplier",
    "PaymentPlan",
    "DocumentChecklist",
    "Acceptance",
    "ContractChange",
    "Contract",
    "WBSItem",
    "Task",
    "ActivityFeed",
    "ApprovalStep",
    "ApprovalRequest",
    "Notification",
    "FinancialSnapshot",
    "DomainEvent",
    "Supplier",
    "Warehouse",
    "MaterialItem",
    "Project",
  ];

  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((table) => `"${table}"`).join(", ")} CASCADE`);
  await prisma.auditLog.deleteMany({});
}

async function ensureCompanyAndUser() {
  const company = await prisma.company.upsert({
    where: { code: "CTY-XD-SO2-HN" },
    update: {
      name: "CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN",
      taxCode: "0100000002-TEST",
      address: `Hà Nội - ${MARKERS}`,
    },
    create: {
      code: "CTY-XD-SO2-HN",
      name: "CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN",
      taxCode: "0100000002-TEST",
      address: `Hà Nội - ${MARKERS}`,
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: "HN-SANDBOX" },
    update: { companyId: company.id, name: "Chi nhánh Hà Nội Sandbox", address: MARKERS },
    create: { companyId: company.id, code: "HN-SANDBOX", name: "Chi nhánh Hà Nội Sandbox", address: MARKERS },
  });

  const existingUser = await prisma.user.findFirst({
    where: { companyId: company.id, role: { in: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "CFO"] } },
    orderBy: { createdAt: "asc" },
  }) ?? await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  const user = existingUser ?? await prisma.user.create({
    data: {
      email: "sandbox.school.seed.admin@example.local",
      name: `Sandbox School Seed Admin - ${MARKERS}`,
      role: "SUPER_ADMIN",
      companyId: company.id,
    },
  });

  return { company, branch, user };
}

async function ensureLedgerAccounts() {
  const accounts: Array<{ code: string; name: string; type: AccountType }> = [
    { code: "1010", name: "Tiền mặt tại quỹ (Seed)", type: "ASSET" },
    { code: "1310", name: "Phải thu khách hàng (Seed)", type: "ASSET" },
    { code: "1331", name: "Thuế GTGT đầu vào được khấu trừ (Seed)", type: "ASSET" },
    { code: "1368", name: "Phải thu giữ lại bảo hành (Seed)", type: "ASSET" },
    { code: "1410", name: "Tạm ứng (Seed)", type: "ASSET" },
    { code: "3310", name: "Phải trả người bán (Seed)", type: "LIABILITY" },
    { code: "3311", name: "Phải trả chưa có hóa đơn (Seed)", type: "LIABILITY" },
    { code: "33311", name: "Thuế GTGT đầu ra phải nộp (Seed)", type: "LIABILITY" },
    { code: "5110", name: "Doanh thu xây dựng (Seed)", type: "INCOME" },
    { code: "6210", name: "Chi phí nguyên vật liệu trực tiếp (Seed)", type: "EXPENSE" },
    { code: "6220", name: "Chi phí nhân công trực tiếp (Seed)", type: "EXPENSE" },
    { code: "6230", name: "Chi phí máy thi công (Seed)", type: "EXPENSE" },
    { code: "6270", name: "Chi phí sản xuất chung (Seed)", type: "EXPENSE" },
  ];

  for (const account of accounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      update: { isActive: true },
      create: account,
    });
  }
}

async function audit(userId: string, action: string, entity: string, entityId: string, newData: unknown) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      newData: JSON.parse(JSON.stringify(newData)),
      reason: MARKERS,
      requestId: `school-seed-${entity}-${entityId}`,
      correlationId: "SEED_SCHOOL_CONSTRUCTION_PROJECT",
    },
  });
}

async function main() {
  assertLocalDatabase();
  await resetBusinessTables();
  await ensureLedgerAccounts();
  const { company, branch, user } = await ensureCompanyAndUser();

  const project = await prisma.project.create({
    data: {
      name: "Công trình xây dựng Trường Tiểu học Minh Khai 2026",
      description: `Mã công trình: CT-TH-2026. Địa điểm: Minh Khai, Hà Nội. ${MARKERS}`,
      investor: "UBND Phường Minh Khai",
      projectType: "Trường học",
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-12-31"),
      contractValue: 12_000_000_000,
      totalBudget: 11_100_000_000,
      companyId: company.id,
      branchId: branch.id,
      ownerId: user.id,
    },
  });
  await audit(user.id, "CREATE", "Project", project.id, project);

  const supplierSeeds = [
    ["NCC-VT-001", "Công ty Vật liệu Minh Anh", "Vật tư xây dựng", 2_500_000_000],
    ["NCC-XM-001", "Công ty Xi măng Hà Nội", "Xi măng/bê tông", 1_200_000_000],
    ["NCC-TB-001", "Công ty Thiết bị Giáo dục Sao Việt", "Thiết bị trường học", 1_000_000_000],
    ["NCC-NC-001", "Đội nhân công Hoàng Gia", "Nhân công", 2_000_000_000],
    ["NCC-MTC-001", "Công ty Máy thi công Long Việt", "Máy thi công", 800_000_000],
    ["NCC-TP-001", "Công ty Thầu phụ An Phát", "Thầu phụ hoàn thiện", 1_500_000_000],
  ] as const;

  const suppliers = new Map<string, { id: string; name: string }>();
  for (const [code, name, type] of supplierSeeds) {
    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        description: `${type}; MST TEST-${code}; ĐT 0900000000; Địa chỉ test Hà Nội. ${MARKERS}`,
      },
    });
    await prisma.projectSupplier.create({ data: { projectId: project.id, supplierId: supplier.id } });
    suppliers.set(code, supplier);
    await audit(user.id, "CREATE", "Supplier", supplier.id, supplier);
  }

  const mainContract = await prisma.contract.create({
    data: {
      projectId: project.id,
      contractNumber: "HD-THMK-2026-001",
      contractCode: "MAIN-OWNER",
      title: "Hợp đồng xây dựng Trường Tiểu học Minh Khai",
      description: `VAT 10%, retention 5%. ${MARKERS}`,
      contractorName: "UBND Phường Minh Khai",
      originalValue: 12_000_000_000,
      currentValue: 12_000_000_000,
      status: ContractStatus.ACTIVE,
      signedDate: new Date("2026-06-01"),
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-12-31"),
      createdById: user.id,
    },
  });
  await audit(user.id, "CREATE", "Contract", mainContract.id, mainContract);

  for (const [code, supplierName, , value] of supplierSeeds) {
    const supplier = suppliers.get(code)!;
    const contract = await prisma.contract.create({
      data: {
        projectId: project.id,
        contractNumber: `HD-${code}-THMK-2026`,
        contractCode: code,
        title: `Hợp đồng/đơn hàng ${supplierName}`,
        description: MARKERS,
        contractorName: supplierName,
        supplierId: supplier.id,
        originalValue: value,
        currentValue: value,
        status: ContractStatus.ACTIVE,
        signedDate: new Date("2026-06-03"),
        startDate: new Date("2026-06-03"),
        endDate: new Date("2026-12-31"),
        createdById: user.id,
      },
    });
    await audit(user.id, "CREATE", "Contract", contract.id, contract);
  }

  const wbsRows = [
    ["1", "Chuẩn bị mặt bằng", null, 0, 1],
    ["1.1", "San lấp mặt bằng", "1", 1, 11],
    ["1.2", "Hàng rào và lán trại", "1", 1, 12],
    ["2", "Phần móng", null, 0, 2],
    ["2.1", "Đào móng", "2", 1, 21],
    ["2.2", "Bê tông móng", "2", 1, 22],
    ["3", "Phần thân", null, 0, 3],
    ["3.1", "Cột/dầm/sàn tầng 1", "3", 1, 31],
    ["3.2", "Cột/dầm/sàn tầng 2", "3", 1, 32],
    ["3.3", "Xây tường", "3", 1, 33],
    ["4", "Hoàn thiện", null, 0, 4],
    ["4.1", "Trát/sơn", "4", 1, 41],
    ["4.2", "Cửa, điện, nước", "4", 1, 42],
    ["4.3", "Sân trường và cảnh quan", "4", 1, 43],
    ["5", "Thiết bị trường học", null, 0, 5],
    ["5.1", "Bàn ghế học sinh", "5", 1, 51],
    ["5.2", "Bảng, thiết bị lớp học", "5", 1, 52],
    ["6", "Chi phí chung công trình", null, 0, 6],
  ] as const;
  const wbs = new Map<string, { id: string; name: string }>();
  for (const [code, name, parentCode, level, sortOrder] of wbsRows) {
    const row = await prisma.wBSItem.create({
      data: {
        projectId: project.id,
        code,
        name,
        parentId: parentCode ? wbs.get(parentCode)!.id : null,
        level,
        sortOrder,
      },
    });
    wbs.set(code, row);
  }
  await audit(user.id, "CREATE", "WBSItem", project.id, { count: wbs.size, markers: MARKERS });

  const budgetRows: Array<[string, CostType, number]> = [
    ["3.3", "material", 3_200_000_000],
    ["2.2", "material", 1_500_000_000],
    ["3.1", "labor", 2_000_000_000],
    ["2.1", "machine", 900_000_000],
    ["4.1", "subcontract", 1_600_000_000],
    ["5.1", "other", 1_000_000_000],
    ["6", "overhead", 500_000_000],
    ["6", "other", 400_000_000],
  ];
  for (const [wbsCode, costType, amount] of budgetRows) {
    await prisma.budgetRecord.create({
      data: { projectId: project.id, wbsId: wbs.get(wbsCode)!.id, costType, estimatedAmount: amount, createdById: user.id },
    });
  }
  await audit(user.id, "CREATE", "BudgetRecord", project.id, { total: 11_100_000_000, markers: MARKERS });

  const costRows: Array<[string, string, CostType, number, string, string, ApprovalStatus, string, boolean]> = [
    ["CP-VT-001", "3.3", "material", 850_000_000, "NCC-VT-001", "Chi phí vật tư đã duyệt/posted", "APPROVED", "POSTED", true],
    ["CP-XM-001", "2.2", "material", 420_000_000, "NCC-XM-001", "Chi phí xi măng/bê tông đã duyệt/posted", "APPROVED", "POSTED", true],
    ["CP-NC-001", "3.1", "labor", 360_000_000, "NCC-NC-001", "Chi phí nhân công đã duyệt/posted", "APPROVED", "POSTED", true],
    ["CP-MTC-001", "2.1", "machine", 150_000_000, "NCC-MTC-001", "Chi phí máy thi công đã duyệt/posted", "APPROVED", "POSTED", true],
    ["CP-TP-001", "4.1", "subcontract", 500_000_000, "NCC-TP-001", "Chi phí thầu phụ chờ duyệt", "PENDING", "PENDING", false],
    ["CP-TB-001", "5.1", "other", 300_000_000, "NCC-TB-001", "Chi phí thiết bị trường học draft", "DRAFT", "DRAFT", false],
    ["CP-CPC-001", "6", "overhead", 90_000_000, "NCC-VT-001", "Chi phí chung công trình draft", "DRAFT", "DRAFT", false],
  ];
  for (const [docNo, wbsCode, costType, gross, supplierCode, note, approvalStatus, workflowStatus, shouldPost] of costRows) {
    const net = Math.round(gross / 1.1);
    const vat = gross - net;
    const cost = await prisma.costRecord.create({
      data: {
        requestId: `seed-${docNo}`,
        projectId: project.id,
        wbsId: wbs.get(wbsCode)!.id,
        costType,
        amount: gross,
        netAmount: net,
        vatAmount: vat,
        vatRate: 10,
        supplier: suppliers.get(supplierCode)!.name,
        note: `${docNo} - ${note}. ${MARKERS}`,
        date: new Date("2026-06-15"),
        status: "unpaid",
        approvalStatus,
        workflowStatus,
        companyId: company.id,
        branchId: branch.id,
        createdById: user.id,
      },
    });
    await audit(user.id, shouldPost ? "APPROVE_POST" : "CREATE", "CostRecord", cost.id, cost);
    if (shouldPost) {
      await prisma.$transaction((tx) => PostingEngine.postCost(tx, {
        costId: cost.id,
        projectId: project.id,
        amount: gross,
        costType,
        description: `${docNo} ${note}`,
      }));
    }
  }

  const advanceRows: Array<[string, string, number, number, string]> = [
    ["TU-VT-001", "NCC-VT-001", 300_000_000, 120_000_000, "Tạm ứng vật tư"],
    ["TU-NC-001", "NCC-NC-001", 200_000_000, 80_000_000, "Tạm ứng nhân công"],
    ["TU-TP-001", "NCC-TP-001", 150_000_000, 0, "Tạm ứng thầu phụ hoàn thiện"],
  ];
  for (const [advanceNo, supplierCode, amount, settled, purpose] of advanceRows) {
    const advance = await prisma.advanceRequest.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        supplierId: suppliers.get(supplierCode)!.id,
        recipientType: "VENDOR",
        advanceNo,
        amount,
        paidAmount: amount,
        settledAmount: settled,
        remainingAmount: amount - settled,
        purpose: `${purpose}. ${MARKERS}`,
        status: settled > 0 ? "PARTIALLY_SETTLED" : "PAID",
        requestedBy: user.id,
        approvedBy: user.id,
        approvedAt: new Date("2026-06-10"),
        paidAt: new Date("2026-06-11"),
      },
    });
    await prisma.$transaction((tx) => PostingEngine.createDoubleEntry(tx, {
      projectId: project.id,
      sourceType: "ADVANCE",
      sourceId: advance.id,
      reference: `ADV-${advance.id}`,
      accountingDate: new Date("2026-06-11"),
      description: `Chi tạm ứng ${advanceNo}`,
      lines: [
        { accountCode: "1410", amount, type: TransactionType.DEBIT },
        { accountCode: "1010", amount, type: TransactionType.CREDIT },
      ],
    }));
    if (settled > 0) {
      const settlement = await prisma.advanceSettlement.create({
        data: {
          companyId: company.id,
          advanceRequestId: advance.id,
          amount: settled,
          status: SettlementStatus.POSTED,
          settlementDate: new Date("2026-06-25"),
          reason: `Đối trừ ${advanceNo}. ${MARKERS}`,
          createdBy: user.id,
          approvedBy: user.id,
          approvedAt: new Date("2026-06-25"),
        },
      });
      await prisma.$transaction((tx) => PostingEngine.createDoubleEntry(tx, {
        projectId: project.id,
        sourceType: "ADVANCE_SETTLEMENT",
        sourceId: settlement.id,
        reference: `SET-${settlement.id}`,
        accountingDate: new Date("2026-06-25"),
        description: `Hoàn ứng/đối trừ ${advanceNo}`,
        lines: [
          { accountCode: "3310", amount: settled, type: TransactionType.DEBIT },
          { accountCode: "1410", amount: settled, type: TransactionType.CREDIT },
        ],
      }));
      await audit(user.id, "POST", "AdvanceSettlement", settlement.id, settlement);
    }
    await audit(user.id, "POST_PAYMENT", "AdvanceRequest", advance.id, advance);
  }

  const postedInvoice = await prisma.invoice.create({
    data: {
      projectId: project.id,
      wbsId: wbs.get("3.1")!.id,
      contractId: mainContract.id,
      invoiceNumber: "INV-THMK-2026-001",
      netAmount: 3_000_000_000,
      vatRate: 10,
      vatAmount: 300_000_000,
      amount: 3_300_000_000,
      retentionRate: 5,
      retentionAmount: 150_000_000,
      paidAmount: 2_000_000_000,
      // DB invariant requires remainingAmount = amount - paidAmount.
      // Collectible AR net of retention is reported separately as 1,150,000,000.
      remainingAmount: 1_300_000_000,
      issuedDate: new Date("2026-07-01"),
      dueDate: new Date("2026-07-31"),
      status: InvoiceStatus.PARTIAL,
      approvalStatus: ApprovalStatus.APPROVED,
      note: `Đợt 1 nghiệm thu. ${MARKERS}`,
      companyId: company.id,
      branchId: branch.id,
      createdById: user.id,
      requestId: "seed-inv-thmk-001",
    },
  });
  await prisma.$transaction((tx) => PostingEngine.postInvoice(tx, {
    invoiceId: postedInvoice.id,
    projectId: project.id,
    amount: 3_300_000_000,
    description: "INV-THMK-2026-001 Đợt 1 nghiệm thu",
  }));
  await audit(user.id, "APPROVE_POST", "Invoice", postedInvoice.id, postedInvoice);

  const payment = await prisma.payment.create({
    data: {
      projectId: project.id,
      invoiceId: postedInvoice.id,
      contractId: mainContract.id,
      amount: 2_000_000_000,
      date: new Date("2026-07-10"),
      description: `Thu tiền đợt 1 từ chủ đầu tư. ${MARKERS}`,
      approvalStatus: ApprovalStatus.APPROVED,
      requestId: "seed-pay-thmk-001",
    },
  });
  await prisma.paymentAllocation.create({
    data: {
      companyId: company.id,
      paymentId: payment.id,
      invoiceId: postedInvoice.id,
      contractId: mainContract.id,
      amount: 2_000_000_000,
      status: "ACTIVE",
      createdBy: user.id,
    },
  });
  await prisma.$transaction((tx) => PostingEngine.postPayment(tx, {
    paymentId: payment.id,
    projectId: project.id,
    amount: 2_000_000_000,
    description: "Thu tiền đợt 1 từ chủ đầu tư",
  }));
  await audit(user.id, "APPROVE_POST", "Payment", payment.id, payment);

  const draftInvoice = await prisma.invoice.create({
    data: {
      projectId: project.id,
      wbsId: wbs.get("4.1")!.id,
      contractId: mainContract.id,
      invoiceNumber: "INV-THMK-2026-DRAFT",
      netAmount: 500_000_000,
      vatRate: 10,
      vatAmount: 50_000_000,
      amount: 550_000_000,
      retentionRate: 5,
      retentionAmount: 25_000_000,
      paidAmount: 0,
      remainingAmount: 550_000_000,
      issuedDate: new Date("2026-07-15"),
      status: InvoiceStatus.DRAFT,
      approvalStatus: ApprovalStatus.DRAFT,
      note: `Draft invoice không ghi sổ. ${MARKERS}`,
      companyId: company.id,
      branchId: branch.id,
      createdById: user.id,
      requestId: "seed-inv-thmk-draft",
    },
  });
  await audit(user.id, "CREATE", "Invoice", draftInvoice.id, draftInvoice);

  await prisma.revenue.create({
    data: {
      projectId: project.id,
      wbsId: wbs.get("3.1")!.id,
      invoiceId: postedInvoice.id,
      amount: 3_300_000_000,
      date: new Date("2026-07-01"),
      status: "paid",
      description: `Legacy revenue mirror for posted invoice. ${MARKERS}`,
      createdById: user.id,
    },
  });

  const cashDebit = await prisma.ledgerAccount.findUniqueOrThrow({ where: { code: "1010" } });
  const arCredit = await prisma.ledgerAccount.findUniqueOrThrow({ where: { code: "1310" } });
  await prisma.cashBankDocument.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      contractId: mainContract.id,
      documentType: CashBankDocumentType.CASH_RECEIPT,
      documentNo: "PT-THMK-2026-001",
      documentDate: new Date("2026-07-10"),
      accountingDate: new Date("2026-07-10"),
      amount: 2_000_000_000,
      description: `Phiếu thu tiền đợt 1. ${MARKERS}`,
      partnerName: "UBND Phường Minh Khai",
      paymentMethod: "BANK",
      debitAccountId: cashDebit.id,
      creditAccountId: arCredit.id,
      status: CashBankDocumentStatus.POSTED,
      createdBy: user.id,
      approvedBy: user.id,
      approvedAt: new Date("2026-07-10"),
    },
  });

  await prisma.taxInvoice.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      contractId: mainContract.id,
      wbsId: wbs.get("3.1")!.id,
      invoiceType: TaxInvoiceType.OUTBOUND,
      invoiceNumber: "0000001",
      invoiceSeries: "TH/26E",
      invoiceDate: new Date("2026-07-01"),
      partnerName: "UBND Phường Minh Khai",
      partnerTaxCode: "0100000000-TEST",
      partnerAddress: "Minh Khai, Hà Nội",
      netAmount: 3_000_000_000,
      vatRate: 10,
      vatAmount: 300_000_000,
      grossAmount: 3_300_000_000,
      status: TaxInvoiceStatus.POSTED,
      description: `Hóa đơn VAT đầu ra đợt 1. ${MARKERS}`,
      sourceType: "INVOICE",
      sourceId: postedInvoice.id,
    },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      code: "KHO-THMK-001",
      name: "Kho công trình Trường Minh Khai",
      address: `Minh Khai, Hà Nội. ${MARKERS}`,
      managerName: "Thủ kho sandbox",
    },
  });
  const material = await prisma.materialItem.create({
    data: {
      companyId: company.id,
      code: "THEP-D10-TEST",
      name: "Thép D10 test",
      unit: "kg",
      group: "Vật tư xây dựng",
    },
  });
  const inventoryDoc = await prisma.inventoryDocument.create({
    data: {
      companyId: company.id,
      projectId: project.id,
      wbsId: wbs.get("3.3")!.id,
      documentType: InventoryDocumentType.PURCHASE_RECEIPT,
      documentNo: "NK-THMK-2026-001",
      documentDate: new Date("2026-06-16"),
      accountingDate: new Date("2026-06-16"),
      status: InventoryDocumentStatus.POSTED,
      supplierId: suppliers.get("NCC-VT-001")!.id,
      sourceWarehouseId: warehouse.id,
      partnerName: suppliers.get("NCC-VT-001")!.name,
      description: `Nhập kho vật tư test. ${MARKERS}`,
      netAmount: 100_000_000,
      vatAmount: 10_000_000,
      grossAmount: 110_000_000,
      createdBy: user.id,
      approvedBy: user.id,
      approvedAt: new Date("2026-06-16"),
    },
  });
  await prisma.inventoryDocumentLine.create({
    data: {
      inventoryDocumentId: inventoryDoc.id,
      materialItemId: material.id,
      quantity: 10_000,
      unitCost: 10_000,
      amount: 100_000_000,
      vatRate: 10,
      vatAmount: 10_000_000,
      grossAmount: 110_000_000,
      sourceWarehouseId: warehouse.id,
      projectId: project.id,
      wbsId: wbs.get("3.3")!.id,
    },
  });

  const approval = await prisma.approvalRequest.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      requesterId: user.id,
      entityType: "CostRecord",
      entityId: "CP-TP-001",
      requestData: { amount: 500_000_000, markers: MARKERS },
      status: ApprovalStatus.PENDING,
      reason: MARKERS,
      updatedAt: new Date(),
    },
  });
  await prisma.approvalStep.create({
    data: {
      id: randomUUID(),
      approvalRequestId: approval.id,
      approverId: user.id,
      status: ApprovalStatus.PENDING,
      stepOrder: 1,
      updatedAt: new Date(),
    },
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Chờ duyệt chi phí thầu phụ",
      message: `CP-TP-001 cần duyệt. ${MARKERS}`,
      type: "APPROVAL",
      severity: "INFO",
      priority: 1,
      entityType: "ApprovalRequest",
      entityId: approval.id,
    },
  });
  await prisma.financialSnapshot.create({
    data: {
      projectId: project.id,
      companyId: company.id,
      snapshotType: "SCHOOL_SEED_QA",
      version: "2026-06-school-seed",
      data: {
        contractValue: 12_000_000_000,
        budget: 11_100_000_000,
        expectedProfit: 900_000_000,
        markers: MARKERS,
      },
      createdBy: user.id,
      reason: MARKERS,
    },
  });

  console.log(JSON.stringify({
    gate: "SANDBOX_SEED_READY_FOR_FULL_UI_REPORT_TESTING",
    project: "CT-TH-2026",
    projectId: project.id,
    markers: MARKERS,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
