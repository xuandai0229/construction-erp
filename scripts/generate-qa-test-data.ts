/**
 * QA Test Data Generator
 * Creates realistic large-scale data for a construction company
 * with multiple projects, complex workflows, and edge cases
 */

import { PrismaClient, UserRole } from "../generated/prisma-client";
import { Decimal } from "decimal.js";

const prisma = new PrismaClient();

// Constants for realistic data generation
const COMPANY_NAME = "TỔNG CÔNG TY XÂY DỰNG LỚNHAT";
const PROJECTS_COUNT = 15;
const WBS_DEPTH = 4;
const MATERIALS_COUNT = 150;
const STAFF_COUNT = 200;
const SUPPLIERS_COUNT = 50;

interface GenerationContext {
  companyId: string;
  branchIds: string[];
  projectIds: string[];
  wbsIds: string[];
  userIds: string[];
  materialIds: string[];
  supplierNames: string[];
  startDate: Date;
}

async function setupCompanyStructure(): Promise<GenerationContext> {
  console.log("🏢 Setting up company structure...");

  // Create company
  const company = await prisma.company.create({
    data: {
      name: COMPANY_NAME,
      code: "LCVN",
      taxCode: "0123456789",
      address: "123 Đường Lê Văn Tươi, Tp.HCM",
    },
  });

  // Create 5 branches
  const branches = [];
  const branchCities = [
    "Ho Chi Minh City",
    "Ha Noi",
    "Da Nang",
    "Can Tho",
    "Ha Long",
  ];
  for (const city of branchCities) {
    const branch = await prisma.branch.create({
      data: {
        name: `Branch ${city}`,
        code: `BR-${city.toUpperCase().replace(" ", "-")}`,
        companyId: company.id,
      },
    });
    branches.push(branch.id);
  }

  // Create 200 staff (mix of roles)
  const users = [];
  const roles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.CFO,
    UserRole.BRANCH_DIRECTOR,
    UserRole.MANAGER,
    UserRole.VIEWER
  ];

  for (let i = 0; i < STAFF_COUNT; i++) {
    const roleIndex = Math.min(i, roles.length - 1);
    const user = await prisma.user.create({
      data: {
        email: `staff${i + 1}@largecorp.vn`,
        name: generateVietnameseName(i),
        role: roles[roleIndex],
        companyId: company.id,
      },
    });
    users.push(user.id);
  }

  // Create materials database (150 materials)
  const materials = [];
  const materialTypes = [
    "Cement",
    "Steel",
    "Brick",
    "Sand",
    "Gravel",
    "Paint",
    "Glass",
    "Tile",
    "Pipe",
    "Wire",
  ];
  const units = ["m3", "tons", "pieces", "kg", "liters", "m2", "m"];

  for (let i = 0; i < MATERIALS_COUNT; i++) {
    const typeIndex = i % materialTypes.length;
    const unitIndex = i % units.length;
    const material = await prisma.material.create({
      data: {
        code: `MAT-${String(i + 1).padStart(5, "0")}`,
        name: `${materialTypes[typeIndex]} Type ${Math.floor(i / materialTypes.length) + 1}`,
        unit: units[unitIndex],
        description: `Quality construction material for large scale projects`,
      },
    });
    materials.push(material.id);
  }

  // Create suppliers (50)
  const suppliers = [
    "Công ty Xi Măng Việt Nam",
    "Thép Việt Nhật",
    "Gạch ốp Đức Phát",
    "Cát sỏi Mekong",
    "Sơn Bình Dương",
    "Kính An Tín",
    "Gạch men Thanh Hải",
    "Ống nước Bình Minh",
    "Dây điện Giải Phóng",
    "Thiết bị xây dựng Hùng Phát",
  ];

  const supplierNames: string[] = [];
  for (let i = 0; i < SUPPLIERS_COUNT; i++) {
    const baseSupplier = suppliers[i % suppliers.length];
    supplierNames.push(`${baseSupplier} ${Math.floor(i / suppliers.length) + 1}`);
  }

  return {
    companyId: company.id,
    branchIds: branches,
    projectIds: [],
    wbsIds: [],
    userIds: users,
    materialIds: materials,
    supplierNames,
    startDate: new Date("2024-01-01"),
  };
}

async function createProjects(ctx: GenerationContext): Promise<void> {
  console.log(`📁 Creating ${PROJECTS_COUNT} projects...`);

  const projectTypes = ["Building", "Infrastructure", "Industrial", "Residential"];
  const investors = [
    "Tập đoàn FPT",
    "Vingroup",
    "BIM Land",
    "Phát Đạt",
    "Hoàng Anh Gia Lai",
  ];

  for (let i = 0; i < PROJECTS_COUNT; i++) {
    const projectType = projectTypes[i % projectTypes.length];
    const investor = investors[i % investors.length];
    const value = new Decimal(
      (Math.random() * 800000000 + 100000000).toFixed(2)
    ); // 100M - 900M

    const startDate = new Date(
      "2024-01-01 + " + (i * 30 + Math.random() * 30) + " days"
    );
    const endDate = new Date(
      startDate.getTime() + (365 + Math.random() * 365) * 24 * 60 * 60 * 1000
    ); // 1-2 years

    const project = await prisma.project.create({
      data: {
        name: `${projectType} Project ${String(i + 1).padStart(2, "0")} - ${generateProjectName()}`,
        description: `Large-scale ${projectType.toLowerCase()} construction project`,
        status: ["PLANNED", "ACTIVE", "COMPLETED"][
          Math.floor(Math.random() * 3)
        ] as ProjectStatus,
        contractValue: value,
        totalBudget: value.times(1.1), // 10% buffer
        startDate,
        endDate,
        ownerId: ctx.userIds[i % ctx.userIds.length],
        companyId: ctx.companyId,
        branchId: ctx.branchIds[i % ctx.branchIds.length],
      },
    });

    ctx.projectIds.push(project.id);
  }
}

async function createWBSStructure(ctx: GenerationContext): Promise<void> {
  console.log("📊 Creating WBS structure for all projects...");

  for (const projectId of ctx.projectIds) {
    await createWBSTree(ctx, projectId, null, 0);
  }
}

async function createWBSTree(
  ctx: GenerationContext,
  projectId: string,
  parentId: string | null,
  depth: number
): Promise<void> {
  if (depth >= WBS_DEPTH) return;

  const itemsAtLevel = depth === 0 ? 5 : 4; // Fewer items at deeper levels
  const wbsNames = [
    "Site Preparation",
    "Foundation",
    "Structure",
    "MEP Systems",
    "Finishing",
  ];

  for (let i = 0; i < itemsAtLevel; i++) {
    const wbsName = `${wbsNames[depth % wbsNames.length]} ${i + 1}`;
    const wbs = await prisma.wbSItem.create({
      data: {
        projectId,
        name: wbsName,
        code: `WBS-${depth}-${i}`,
        level: depth,
        parentId,
        budgetAmount: new Decimal(
          (Math.random() * 5000000 + 500000).toFixed(2)
        ),
        sortOrder: i,
      },
    });

    ctx.wbsIds.push(wbs.id);

    // Recurse for children
    if (depth < WBS_DEPTH - 1) {
      await createWBSTree(ctx, projectId, wbs.id, depth + 1);
    }
  }
}

async function createBOQAndBudgets(ctx: GenerationContext): Promise<void> {
  console.log("📐 Creating BOQ items and budgets...");

  for (const projectId of ctx.projectIds) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { wbsItems: true },
    });

    if (!project) continue;

    const wbsItems = project.wbsItems.filter(
      (w) => w.level === WBS_DEPTH - 1
    ); // Leaf items

    for (const wbs of wbsItems) {
      // Create 3-10 BOQ items per leaf WBS
      const boqCount = Math.floor(Math.random() * 8 + 3);

      for (let i = 0; i < boqCount; i++) {
        const quantity = new Decimal((Math.random() * 1000 + 10).toFixed(3));
        const unitRate = new Decimal((Math.random() * 50000 + 1000).toFixed(2));
        const totalAmount = quantity.times(unitRate);

        await prisma.bOQItem.create({
          data: {
            projectId,
            wbsId: wbs.id,
            description: `${["Concrete", "Steel", "Formwork", "Finishing"][i % 4]} work - Item ${i + 1}`,
            unit: ["m3", "tons", "m2", "m"][i % 4],
            quantity,
            unitRate,
            totalAmount,
            status: "ACTIVE",
          },
        });
      }

      // Create budget records
      const costTypes: CostType[] = ["material", "labor", "equipment"];
      for (const costType of costTypes) {
        const amount = wbs.budgetAmount.times(0.33).plus(
          Math.random() * 1000000
        );
        await prisma.budgetRecord.create({
          data: {
            projectId,
            wbsId: wbs.id,
            costType,
            estimatedAmount: amount,
            createdById: ctx.userIds[0],
          },
        });
      }
    }
  }
}

async function createFinancialData(ctx: GenerationContext): Promise<void> {
  console.log("💰 Creating financial transactions...");

  for (const projectId of ctx.projectIds) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { wbsItems: true },
    });

    if (!project) continue;

    const leafWbs = project.wbsItems.filter((w) => w.level === WBS_DEPTH - 1);
    const costsPerProject = Math.floor(Math.random() * 200 + 50);

    // Create costs
    for (let i = 0; i < costsPerProject; i++) {
      const wbs = leafWbs[Math.floor(Math.random() * leafWbs.length)];
      const quantity = new Decimal((Math.random() * 100 + 1).toFixed(2));
      const unitPrice = new Decimal((Math.random() * 50000 + 1000).toFixed(2));
      const netAmount = quantity.times(unitPrice);
      const vatRate = new Decimal("10");
      const vatAmount = netAmount.times(vatRate).dividedBy(100);
      const amount = netAmount.plus(vatAmount);

      const costStatus: PaymentStatus =
        Math.random() > 0.3 ? "paid" : "unpaid";

      await prisma.costRecord.create({
        data: {
          projectId,
          wbsId: wbs.id,
          costType: ["material", "labor", "equipment"][
            Math.floor(Math.random() * 3)
          ] as CostType,
          amount,
          netAmount,
          quantity,
          unitPrice,
          vatRate,
          vatAmount,
          supplier:
            ctx.supplierNames[
              Math.floor(Math.random() * ctx.supplierNames.length)
            ],
          status: costStatus,
          note: generateCostNote(i),
          date: new Date(
            ctx.startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          createdById: ctx.userIds[Math.floor(Math.random() * 50)],
          companyId: ctx.companyId,
          branchId: project.branchId,
        },
      });
    }

    // Create invoices and payments
    const invoicesPerProject = Math.floor(Math.random() * 100 + 20);

    for (let i = 0; i < invoicesPerProject; i++) {
      const wbs = leafWbs[Math.floor(Math.random() * leafWbs.length)];
      const amount = new Decimal(
        (Math.random() * 500000000 + 10000000).toFixed(2)
      );
      const netAmount = amount.dividedBy(1.1);
      const vatAmount = amount.minus(netAmount);

      const invoice = await prisma.invoice.create({
        data: {
          projectId,
          wbsId: wbs.id,
          amount,
          netAmount,
          vatAmount,
          vatRate: new Decimal("10"),
          issuedDate: new Date(
            ctx.startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          dueDate: new Date(
            ctx.startDate.getTime() +
              (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000
          ),
          invoiceNumber: `INV-${projectId.slice(0, 8)}-${String(i + 1).padStart(5, "0")}`,
          status: ["DRAFT", "ISSUED", "PAID"][
            Math.floor(Math.random() * 3)
          ] as InvoiceStatus,
          createdById: ctx.userIds[0],
          companyId: ctx.companyId,
          branchId: project.branchId,
        },
      });

      // Create payments for invoices
      if (invoice.status !== "DRAFT") {
        const paymentsCount = Math.random() > 0.5 ? 1 : 2;
        let paidAmount = new Decimal(0);

        for (let p = 0; p < paymentsCount; p++) {
          const paymentAmount =
            p === paymentsCount - 1
              ? amount.minus(paidAmount) // Last payment gets the rest
              : amount.times(new Decimal(Math.random() * 0.6 + 0.2)); // Partial payments

          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              projectId,
              amount: paymentAmount,
              date: new Date(
                invoice.issuedDate.getTime() +
                  (p + 1) * (10 + Math.random() * 20) * 24 * 60 * 60 * 1000
              ),
              description: `Payment ${p + 1} for ${invoice.invoiceNumber}`,
              approvalStatus: "APPROVED",
            },
          });

          paidAmount = paidAmount.plus(paymentAmount);
        }

        // Update invoice paid amount
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount,
            remainingAmount: amount.minus(paidAmount),
          },
        });
      }
    }

    // Create revenues
    const revenuesPerProject = Math.floor(Math.random() * 50 + 10);

    for (let i = 0; i < revenuesPerProject; i++) {
      const wbs = leafWbs[Math.floor(Math.random() * leafWbs.length)];
      const amount = new Decimal(
        (Math.random() * 300000000 + 5000000).toFixed(2)
      );

      await prisma.revenue.create({
        data: {
          projectId,
          wbsId: wbs.id,
          amount,
          status: Math.random() > 0.2 ? "paid" : "unpaid",
          date: new Date(
            ctx.startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          createdById: ctx.userIds[0],
        },
      });
    }
  }
}

async function createInventoryData(ctx: GenerationContext): Promise<void> {
  console.log("📦 Creating inventory transactions...");

  for (const projectId of ctx.projectIds) {
    for (const materialId of ctx.materialIds.slice(0, 50)) {
      // 50 materials per project
      const transactionsCount = Math.floor(Math.random() * 20 + 5);

      let quantity = new Decimal(0);

      for (let i = 0; i < transactionsCount; i++) {
        const type: InventoryTransactionType =
          quantity === 0 || Math.random() > 0.3 ? "IN" : "OUT";
        const amount = new Decimal((Math.random() * 100 + 1).toFixed(3));
        const transactionQuantity = type === "IN" ? amount : amount;

        await prisma.inventoryTransaction.create({
          data: {
            projectId,
            materialId,
            type,
            quantity: transactionQuantity,
            unitPrice:
              type === "IN"
                ? new Decimal((Math.random() * 10000 + 100).toFixed(2))
                : null,
            referenceId: `REF-${projectId.slice(0, 8)}-${i}`,
            note: `${type === "IN" ? "Received" : "Used"} material transaction`,
          },
        });

        quantity =
          type === "IN" ? quantity.plus(transactionQuantity) : quantity;
      }
    }
  }
}

async function createAuditLogs(ctx: GenerationContext): Promise<void> {
  console.log("📋 Creating audit logs...");

  for (const projectId of ctx.projectIds) {
    const actions = [
      "CREATE",
      "UPDATE",
      "DELETE",
      "APPROVE",
      "REJECT",
      "VIEW",
    ];
    const entities = [
      "Cost",
      "Invoice",
      "Budget",
      "WBSItem",
      "Project",
      "Payment",
    ];

    for (let i = 0; i < 100; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const entity = entities[Math.floor(Math.random() * entities.length)];

      await prisma.auditLog.create({
        data: {
          userId: ctx.userIds[Math.floor(Math.random() * 50)],
          action,
          entity,
          entityId: projectId,
          timestamp: new Date(
            ctx.startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ),
          severity: Math.random() > 0.7 ? "WARNING" : "INFO",
          reason:
            action === "DELETE"
              ? "Data cleanup"
              : `${action} operation on ${entity}`,
        },
      });
    }
  }
}

// Helper functions
function generateVietnameseName(index: number): string {
  const firstNames = [
    "Nguyễn",
    "Trần",
    "Phạm",
    "Hoàng",
    "Võ",
    "Phan",
    "Lý",
    "Đặng",
  ];
  const lastNames = [
    "Văn A",
    "Thị B",
    "Quốc C",
    "Minh D",
    "Hùng E",
    "Anh F",
    "Nam G",
    "Linh H",
  ];

  return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
}

function generateProjectName(): string {
  const prefixes = [
    "Central Tower",
    "Green Valley",
    "Riverside Complex",
    "Sky Plaza",
    "Smart District",
  ];
  const suffixes = ["A", "B", "C", "D", "E"];

  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} Block ${
    suffixes[Math.floor(Math.random() * suffixes.length)]
  }`;
}

function generateCostNote(index: number): string {
  const notes = [
    "Material delivery and storage",
    "Labor cost for foundation",
    "Equipment rental",
    "Subcontractor payment",
    "Site preparation",
    "Contingency allocation",
  ];

  return notes[index % notes.length];
}

// Main execution
async function main() {
  try {
    console.log("🚀 Starting QA Test Data Generation...\n");

    const ctx = await setupCompanyStructure();
    console.log(`✅ Company setup: ${ctx.companyId}`);
    console.log(`✅ Created ${ctx.branchIds.length} branches`);
    console.log(`✅ Created ${ctx.userIds.length} staff members`);
    console.log(`✅ Created ${ctx.materialIds.length} materials\n`);

    await createProjects(ctx);
    console.log(`✅ Created ${ctx.projectIds.length} projects\n`);

    await createWBSStructure(ctx);
    console.log(`✅ Created WBS structure with ${ctx.wbsIds.length} items\n`);

    await createBOQAndBudgets(ctx);
    console.log(`✅ Created BOQ items and budget records\n`);

    await createFinancialData(ctx);
    console.log(`✅ Created financial transactions (costs, invoices, payments)\n`);

    await createInventoryData(ctx);
    console.log(`✅ Created inventory transactions\n`);

    await createAuditLogs(ctx);
    console.log(`✅ Created audit logs\n`);

    console.log("✨ QA Test Data Generation Complete!\n");
    console.log("Summary:");
    console.log(`- Company: ${ctx.companyId}`);
    console.log(`- Projects: ${ctx.projectIds.length}`);
    console.log(`- WBS Items: ${ctx.wbsIds.length}`);
    console.log(`- Staff: ${ctx.userIds.length}`);
    console.log(`- Materials: ${ctx.materialIds.length}`);
    console.log(`- Suppliers: ${ctx.supplierNames.length}`);
  } catch (error) {
    console.error("❌ Error during data generation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

// Type imports from Prisma
type ProjectStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "SUSPENDED";
type CostType = "material" | "labor" | "equipment";
type PaymentStatus = "paid" | "unpaid";
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
type InventoryTransactionType = "IN" | "OUT";
