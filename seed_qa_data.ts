import { prisma } from "./lib/prisma";
import { Decimal } from "decimal.js";
import { seedChartOfAccounts } from "./lib/accounting/chartOfAccounts";

/**
 * COMPREHENSIVE QA SEED DATA
 * Creates realistic large-scale construction ERP data
 */

async function main() {
  console.log("🚀 Starting comprehensive QA data seeding...\n");

  try {
    // Step 1: Seed Chart of Accounts
    console.log("📊 1. Seeding Chart of Accounts...");
    await prisma.$transaction(async (tx) => {
      await seedChartOfAccounts(tx);
    });
    console.log("✅ Chart of Accounts seeded\n");

    // Step 2: Create Users
    console.log("👥 2. Creating users...");
    const users = await createUsers();
    console.log(`✅ Created ${users.length} users\n`);

    // Step 3: Create Projects
    console.log("🏗️ 3. Creating projects...");
    const projects = await createProjects(users);
    console.log(`✅ Created ${projects.length} projects\n`);

    // Step 4: Create WBS for each project
    console.log("📐 4. Creating WBS hierarchies...");
    const wbsItems = await createWBSItems(projects);
    console.log(`✅ Created ${wbsItems.length} WBS items\n`);

    // Step 5: Create Budgets
    console.log("💰 5. Creating budgets...");
    const budgets = await createBudgets(projects, wbsItems);
    console.log(`✅ Created ${budgets.length} budget records\n`);

    // Step 6: Create BOQ Items
    console.log("📋 6. Creating BOQ items...");
    const boqItems = await createBOQItems(projects, wbsItems);
    console.log(`✅ Created ${boqItems.length} BOQ items\n`);

    // Step 7: Create Cost Records
    console.log("📝 7. Creating cost records...");
    const costs = await createCostRecords(projects, wbsItems, users);
    console.log(`✅ Created ${costs.length} cost records\n`);

    // Step 8: Create Progress Entries
    console.log("📈 8. Creating progress entries...");
    const progress = await createProgressEntries(boqItems, users);
    console.log(`✅ Created ${progress.length} progress entries\n`);

    // Step 9: Create Revenue & Invoices
    console.log("📊 9. Creating revenue & invoices...");
    const { revenues, invoices } = await createRevenueAndInvoices(projects, wbsItems, users);
    console.log(`✅ Created ${revenues.length} revenue records & ${invoices.length} invoices\n`);

    // Step 10: Create Payments
    console.log("💳 10. Creating payments...");
    const payments = await createPayments(invoices, projects);
    console.log(`✅ Created ${payments.length} payments\n`);

    // Step 11: Create Procurement Items
    console.log("🛒 11. Creating procurement items...");
    const { purchaseRequests, purchaseOrders, goodsReceipts } = await createProcurementItems(projects, wbsItems, users);
    console.log(`✅ Created ${purchaseRequests.length} PRs, ${purchaseOrders.length} POs, ${goodsReceipts.length} GRNs\n`);

    // Step 12: Create Contracts
    console.log("📄 12. Creating contracts...");
    const contracts = await createContracts(projects, users);
    console.log(`✅ Created ${contracts.length} contracts\n`);

    // Step 13: Create Subcontracts
    console.log("🏢 13. Creating subcontracts...");
    const { subcontracts, subcontractItems, subcontractProgress } = await createSubcontracts(projects, wbsItems);
    console.log(`✅ Created ${subcontracts.length} subcontracts, ${subcontractItems.length} items, ${subcontractProgress.length} progress records\n`);

    // Step 14: Create Materials & Inventory
    console.log("📦 14. Creating materials & inventory transactions...");
    const { materials, inventoryTransactions, siteConsumptions } = await createInventory(projects, wbsItems);
    console.log(`✅ Created ${materials.length} materials, ${inventoryTransactions.length} transactions, ${siteConsumptions.length} consumptions\n`);

    // Step 15: Create Journal Entries
    console.log("📚 15. Creating journal entries...");
    const journalEntries = await createJournalEntries(projects, costs, invoices, payments);
    console.log(`✅ Created ${journalEntries.length} journal entries\n`);

    console.log("\n✨ ===== QA DATA SEEDING COMPLETED SUCCESSFULLY ===== ✨");
    console.log("\nData Summary:");
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Projects: ${projects.length}`);
    console.log(`  • WBS Items: ${wbsItems.length}`);
    console.log(`  • Budget Records: ${budgets.length}`);
    console.log(`  • BOQ Items: ${boqItems.length}`);
    console.log(`  • Cost Records: ${costs.length}`);
    console.log(`  • Progress Entries: ${progress.length}`);
    console.log(`  • Revenue Records: ${revenues.length}`);
    console.log(`  • Invoices: ${invoices.length}`);
    console.log(`  • Payments: ${payments.length}`);
    console.log(`  • Purchase Requests: ${purchaseRequests.length}`);
    console.log(`  • Purchase Orders: ${purchaseOrders.length}`);
    console.log(`  • Goods Receipts: ${goodsReceipts.length}`);
    console.log(`  • Contracts: ${contracts.length}`);
    console.log(`  • Subcontracts: ${subcontracts.length}`);
    console.log(`  • Materials: ${materials.length}`);
    console.log(`  • Inventory Transactions: ${inventoryTransactions.length}`);
    console.log(`  • Site Consumptions: ${siteConsumptions.length}`);
    console.log(`  • Journal Entries: ${journalEntries.length}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

async function createUsers() {
  const userEmails = [
    "admin@company.com",
    "ceo@company.com",
    "cfo@company.com",
    "pm1@company.com",
    "pm2@company.com",
    "accountant1@company.com",
    "accountant2@company.com",
    "accountant3@company.com",
    "procurement@company.com",
    "warehouse@company.com",
    "site-manager1@company.com",
    "site-manager2@company.com",
    "viewer1@company.com",
    "viewer2@company.com",
    "manager@company.com",
  ];

  const roles = ["ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"];
  const users = [];

  for (let i = 0; i < userEmails.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: userEmails[i] },
      update: {},
      create: {
        email: userEmails[i],
        name: userEmails[i].split("@")[0].toUpperCase(),
        role: roles[i % roles.length] as any,
      },
    });
    users.push(user);
  }

  return users;
}

async function createProjects(users: any[]) {
  const projectNames = [
    "Da Nang Marina Tower - 500 billion VND",
    "Ho Chi Minh Tran Hung Dao Bridge - 350 billion VND",
    "Hanoi Smart Office Complex - 280 billion VND",
    "Can Tho Riverside Apartments - 180 billion VND",
    "Hai Phong Industrial Park - 200 billion VND",
    "Da Lat Resort & Spa - 95 billion VND",
    "Nha Trang Convention Center - 120 billion VND",
    "Vung Tau Port Expansion - 420 billion VND",
    "Quang Ninh Underground Railway - 600 billion VND",
    "Binh Duong Trading Complex - 140 billion VND",
  ];

  const projects = [];
  for (let i = 0; i < projectNames.length; i++) {
    const project = await prisma.project.create({
      data: {
        name: projectNames[i],
        description: `Major construction project ${i + 1}`,
        status: i % 2 === 0 ? "IN_PROGRESS" : "PLANNED",
        ownerId: users[i % users.length].id,
        contractValue: new Decimal(50000000000 + i * 10000000000), // 50B to 600B
        totalBudget: new Decimal(55000000000 + i * 10000000000),
        startDate: new Date(2024, i % 12, 1),
        endDate: new Date(2025 + Math.floor(i / 4), (i + 6) % 12, 1),
      },
    });
    projects.push(project);
  }

  return projects;
}

async function createWBSItems(projects: any[]) {
  const wbsItems = [];

  for (const project of projects) {
    // Create 20 WBS items per project
    const mainWBS = [
      "Công tác chuẩn bị",
      "Xây dựng kết cấu",
      "Hệ thống MEP",
      "Hoàn thiện nội thất",
      "Hạ tầng & Cảnh quan",
    ];

    for (let i = 0; i < mainWBS.length; i++) {
      // Parent WBS
      const parent = await prisma.wBSItem.create({
        data: {
          projectId: project.id,
          name: mainWBS[i],
          code: `WBS-${i + 1}`,
          level: 0,
          sortOrder: i,
          budgetAmount: new Decimal(10000000000 + i * 1000000000),
        },
      });

      // 4 sub-items per parent
      for (let j = 0; j < 4; j++) {
        await prisma.wBSItem.create({
          data: {
            projectId: project.id,
            name: `${mainWBS[i]} - Item ${j + 1}`,
            code: `WBS-${i + 1}-${j + 1}`,
            parentId: parent.id,
            level: 1,
            sortOrder: j,
            budgetAmount: new Decimal(2000000000 + j * 200000000),
          },
        });
      }

      wbsItems.push(parent);
    }
  }

  return wbsItems;
}

async function createBudgets(projects: any[], wbsItems: any[]) {
  const budgets = [];
  const costTypes = ["material", "labor", "machine", "overhead", "subcontract", "other"];

  for (const wbs of wbsItems.slice(0, 50)) {
    for (const costType of costTypes) {
      const budget = await prisma.budgetRecord.create({
        data: {
          projectId: wbs.projectId,
          wbsId: wbs.id,
          costType: costType as any,
          estimatedAmount: new Decimal(Math.random() * 1000000000),
        },
      });
      budgets.push(budget);
    }
  }

  return budgets;
}

async function createBOQItems(projects: any[], wbsItems: any[]) {
  const boqItems = [];
  const descriptions = [
    "Bê tông cường độ cao",
    "Thép xây dựng",
    "Gạch xây",
    "Cát và sỏi",
    "Sơn ngoài thất",
    "Lát gạch",
    "Ống nước PVC",
    "Dây điện",
  ];
  const units = ["m3", "tấn", "cái", "m2", "m"];

  for (const project of projects) {
    for (let i = 0; i < 50; i++) {
      const boq = await prisma.bOQItem.create({
        data: {
          projectId: project.id,
          wbsId: wbsItems.find((w) => w.projectId === project.id)?.id || wbsItems[0].id,
          description: descriptions[i % descriptions.length],
          unit: units[i % units.length],
          quantity: new Decimal(100 + i * 10),
          unitRate: new Decimal(1000000 + i * 50000),
          totalAmount: new Decimal((100 + i * 10) * (1000000 + i * 50000)),
        },
      });
      boqItems.push(boq);
    }
  }

  return boqItems;
}

async function createCostRecords(projects: any[], wbsItems: any[], users: any[]) {
  const costs = [];
  const costTypes = ["material", "labor", "machine", "overhead", "subcontract", "other"];
  const suppliers = ["Công ty A", "Công ty B", "Nhà cung cấp C", "Vendor D", "Provider E"];

  for (const project of projects) {
    for (let i = 0; i < 300; i++) {
      const cost = await prisma.costRecord.create({
        data: {
          projectId: project.id,
          wbsId: wbsItems.find((w) => w.projectId === project.id)?.id || wbsItems[0].id,
          costType: costTypes[i % costTypes.length] as any,
          amount: new Decimal(50000000 + i * 1000000),
          quantity: new Decimal(10 + i),
          unitPrice: new Decimal(5000000 + i * 50000),
          supplier: suppliers[i % suppliers.length],
          status: i % 3 === 0 ? "unpaid" : "paid",
          date: new Date(2024, i % 12, (i % 28) + 1),
          createdById: users[i % users.length].id,
        },
      });
      costs.push(cost);
    }
  }

  return costs;
}

async function createProgressEntries(boqItems: any[], users: any[]) {
  const progress = [];

  for (const boq of boqItems.slice(0, 100)) {
    for (let i = 0; i < 3; i++) {
      const entry = await prisma.progressEntry.create({
        data: {
          boqItemId: boq.id,
          quantity: new Decimal(Math.random() * 50),
          amount: new Decimal(Math.random() * 100000000),
          createdById: users[i % users.length].id,
          status: i < 2 ? "VERIFIED" : "PENDING",
          date: new Date(2024, i, (i % 28) + 1),
        },
      });
      progress.push(entry);
    }
  }

  return progress;
}

async function createRevenueAndInvoices(projects: any[], wbsItems: any[], users: any[]) {
  const revenues = [];
  const invoices = [];

  for (const project of projects) {
    for (let i = 0; i < 15; i++) {
      const invoice = await prisma.invoice.create({
        data: {
          projectId: project.id,
          wbsId: wbsItems.find((w) => w.projectId === project.id)?.id || wbsItems[0].id,
          invoiceNumber: `INV-${project.id.substring(0, 8)}-${i + 1}`,
          amount: new Decimal(10000000000 + i * 100000000),
          paidAmount: i < 5 ? new Decimal(10000000000 + i * 100000000) : new Decimal(0),
          remainingAmount: i < 5 ? new Decimal(0) : new Decimal(10000000000 + i * 100000000),
          status: i < 5 ? "PAID" : i < 10 ? "PARTIAL" : "DRAFT",
          issuedDate: new Date(2024, i % 12, 1),
          dueDate: new Date(2024, (i + 1) % 12, 15),
          retentionAmount: new Decimal((10000000000 + i * 100000000) * 0.05),
          certifiedProgress: new Decimal(100 - i * 5),
          createdById: users[i % users.length].id,
        },
      });
      invoices.push(invoice);

      // Create revenue for each invoice
      const revenue = await prisma.revenue.create({
        data: {
          projectId: project.id,
          wbsId: invoice.wbsId,
          invoiceId: invoice.id,
          amount: invoice.amount,
          status: i < 5 ? "paid" : "unpaid",
          date: invoice.issuedDate,
          createdById: users[i % users.length].id,
        },
      });
      revenues.push(revenue);
    }
  }

  return { revenues, invoices };
}

async function createPayments(invoices: any[], projects: any[]) {
  const payments = [];

  for (let i = 0; i < invoices.length / 2; i++) {
    const invoice = invoices[i];
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        amount: invoice.amount,
        date: new Date(2024, (i + 2) % 12, (i % 28) + 1),
      },
    });
    payments.push(payment);
  }

  return payments;
}

async function createProcurementItems(projects: any[], wbsItems: any[], users: any[]) {
  const purchaseRequests = [];
  const purchaseOrders = [];
  const goodsReceipts = [];

  for (const project of projects) {
    for (let i = 0; i < 20; i++) {
      const pr = await prisma.purchaseRequest.create({
        data: {
          projectId: project.id,
          title: `Purchase Request ${i + 1}`,
          description: `PR for project ${project.name}`,
          status: "APPROVED",
          totalAmount: new Decimal(5000000000 + i * 100000000),
          createdById: users[i % users.length].id,
        },
      });
      purchaseRequests.push(pr);

      // Create PO
      const po = await prisma.purchaseOrder.create({
        data: {
          projectId: project.id,
          purchaseRequestId: pr.id,
          poNumber: `PO-${project.id.substring(0, 8)}-${i + 1}`,
          vendor: `Vendor ${i + 1}`,
          status: "RECEIVED",
          totalAmount: pr.totalAmount,
          createdById: users[i % users.length].id,
          items: {
            create: [
              {
                description: "Item 1",
                quantity: new Decimal(100),
                unitPrice: new Decimal(10000000),
                amount: new Decimal(1000000000),
                costType: "material",
              },
              {
                description: "Item 2",
                quantity: new Decimal(50),
                unitPrice: new Decimal(20000000),
                amount: new Decimal(1000000000),
                costType: "material",
              },
            ],
          },
        },
      });
      purchaseOrders.push(po);

      // Create GRN
      const grn = await prisma.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          projectId: project.id,
          receivedDate: new Date(2024, i % 12, (i % 28) + 1),
        },
      });
      goodsReceipts.push(grn);
    }
  }

  return { purchaseRequests, purchaseOrders, goodsReceipts };
}

async function createContracts(projects: any[], users: any[]) {
  const contracts = [];
  const contractorNames = [
    "Công ty xây dựng A",
    "Công ty xây dựng B",
    "Công ty xây dựng C",
    "Tập đoàn xây dựng X",
    "Tập đoàn xây dựng Y",
  ];

  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      const contract = await prisma.contract.create({
        data: {
          projectId: project.id,
          contractNumber: `CTR-${project.id.substring(0, 8)}-${i + 1}`,
          title: `Contract ${i + 1} for ${project.name}`,
          contractorName: contractorNames[i % contractorNames.length],
          originalValue: new Decimal(50000000000 + i * 5000000000),
          currentValue: new Decimal(50000000000 + i * 5000000000),
          status: i === 0 ? "ACTIVE" : "DRAFT",
          signedDate: new Date(2024, 0, 1),
          startDate: new Date(2024, 1, 1),
          endDate: new Date(2025, 1, 1),
          createdById: users[i % users.length].id,
        },
      });
      contracts.push(contract);
    }
  }

  return contracts;
}

async function createSubcontracts(projects: any[], wbsItems: any[]) {
  const subcontracts = [];
  const subcontractItems = [];
  const subcontractProgress = [];

  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      const subcontract = await prisma.subcontract.create({
        data: {
          projectId: project.id,
          contractorName: `Subcontractor ${i + 1}`,
          contractNumber: `SUBCTR-${project.id.substring(0, 8)}-${i + 1}`,
          title: `Subcontract ${i + 1}`,
          status: "ACTIVE",
          totalValue: new Decimal(10000000000 + i * 1000000000),
          retentionRate: new Decimal(5),
        },
      });
      subcontracts.push(subcontract);

      // Create subcontract items
      for (let j = 0; j < 10; j++) {
        const item = await prisma.subcontractItem.create({
          data: {
            subcontractId: subcontract.id,
            wbsId: wbsItems.find((w) => w.projectId === project.id)?.id || wbsItems[0].id,
            description: `Subcontract Item ${j + 1}`,
            unit: "m2",
            quantity: new Decimal(1000 + j * 100),
            unitRate: new Decimal(500000 + j * 50000),
            totalAmount: new Decimal((1000 + j * 100) * (500000 + j * 50000)),
          },
        });
        subcontractItems.push(item);

        // Create progress
        const progress = await prisma.subcontractProgress.create({
          data: {
            subcontractItemId: item.id,
            quantity: new Decimal((1000 + j * 100) * 0.5),
            amount: new Decimal(((1000 + j * 100) * 0.5) * (500000 + j * 50000)),
            status: "CERTIFIED",
          },
        });
        subcontractProgress.push(progress);
      }
    }
  }

  return { subcontracts, subcontractItems, subcontractProgress };
}

async function createInventory(projects: any[], wbsItems: any[]) {
  const materials = [];
  const inventoryTransactions = [];
  const siteConsumptions = [];

  const materialCodes = [
    "MAT-001",
    "MAT-002",
    "MAT-003",
    "MAT-004",
    "MAT-005",
    "MAT-006",
    "MAT-007",
    "MAT-008",
  ];
  const materialNames = [
    "Bê tông cường độ cao",
    "Thép xây dựng",
    "Gạch xây",
    "Cát",
    "Sơn ngoài thất",
    "Ống nước PVC",
    "Dây điện",
    "Vật liệu cách âm",
  ];

  // Create materials
  for (let i = 0; i < materialCodes.length; i++) {
    const material = await prisma.material.create({
      data: {
        code: materialCodes[i],
        name: materialNames[i],
        unit: i < 3 ? "m3" : i < 5 ? "m2" : "cái",
      },
    });
    materials.push(material);
  }

  // Create inventory transactions
  for (const project of projects) {
    for (let i = 0; i < 50; i++) {
      const transaction = await prisma.inventoryTransaction.create({
        data: {
          projectId: project.id,
          materialId: materials[i % materials.length].id,
          type: i % 4 === 0 ? "RECEIPT" : i % 4 === 1 ? "ISSUE" : i % 4 === 2 ? "RETURN" : "ADJUST",
          quantity: new Decimal(100 + i * 10),
          unitPrice: new Decimal(1000000),
        },
      });
      inventoryTransactions.push(transaction);
    }

    // Create site consumptions
    for (let i = 0; i < 30; i++) {
      const consumption = await prisma.siteConsumption.create({
        data: {
          projectId: project.id,
          wbsId: wbsItems.find((w) => w.projectId === project.id)?.id || wbsItems[0].id,
          materialId: materials[i % materials.length].id,
          quantity: new Decimal(50 + i * 5),
          date: new Date(2024, i % 12, (i % 28) + 1),
        },
      });
      siteConsumptions.push(consumption);
    }
  }

  return { materials, inventoryTransactions, siteConsumptions };
}

async function createJournalEntries(projects: any[], costs: any[], invoices: any[], payments: any[]) {
  const journalEntries = [];

  // Sample journal entries for costs
  for (let i = 0; i < Math.min(costs.length, 100); i++) {
    const cost = costs[i];
    const entry = await prisma.journalEntry.create({
      data: {
        projectId: cost.projectId,
        description: `Cost posting - ${cost.id}`,
        sourceType: "COST",
        sourceId: cost.id,
        date: cost.date,
        lines: {
          create: [
            {
              accountId: (await prisma.ledgerAccount.findFirst({ where: { code: "6210" } }))?.id || "",
              amount: cost.amount,
              type: "DEBIT",
              description: "Material expense",
            },
            {
              accountId: (await prisma.ledgerAccount.findFirst({ where: { code: "3310" } }))?.id || "",
              amount: cost.amount,
              type: "CREDIT",
              description: "Accounts Payable",
            },
          ],
        },
      },
    });
    journalEntries.push(entry);
  }

  return journalEntries;
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
