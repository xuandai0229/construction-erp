const { PrismaClient } = require("../generated/prisma-client");

const prisma = new PrismaClient();

const RUN = "AUDIT_20260518";
const now = new Date();

function d(monthOffset, day = 15) {
  return new Date(Date.UTC(2025, monthOffset, day));
}

function money(base, i, factor = 1) {
  return Math.round((base + (i % 37) * base * 0.017 + (i % 11) * 1370000) * factor);
}

async function main() {
  console.log("[enterprise-audit-seed] Creating enterprise construction ERP dataset...");

  const company = await prisma.company.upsert({
    where: { code: `${RUN}_CO` },
    update: {},
    create: {
      id: `${RUN}_company`,
      code: `${RUN}_CO`,
      name: "Audit Mega Construction Group",
      taxCode: "0319999999",
      address: "Khu do thi Thu Thiem, TP.HCM",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: `${RUN}_SGN` },
    update: {},
    create: {
      id: `${RUN}_branch_sgn`,
      companyId: company.id,
      code: `${RUN}_SGN`,
      name: "Ho Chi Minh Mega Projects Branch",
      address: "Quan 2, TP.HCM",
    },
  });

  const users = [];
  for (const role of ["SUPER_ADMIN", "CFO", "BRANCH_DIRECTOR", "ACCOUNTANT", "MANAGER", "AUDITOR", "VIEWER"]) {
    users.push(await prisma.user.upsert({
      where: { email: `${role.toLowerCase()}@audit-erp.local` },
      update: { role, companyId: company.id },
      create: {
        id: `${RUN}_user_${role.toLowerCase()}`,
        email: `${role.toLowerCase()}@audit-erp.local`,
        name: `Audit ${role}`,
        role,
        companyId: company.id,
      },
    }));
  }

  const projectSpecs = [
    ["city", "Khu do thi Audit City 120ha", "ACTIVE", 1850000000000, 1610000000000, "Urban township"],
    ["hospital", "Benh vien da khoa Audit 1.200 giuong", "IN_PROGRESS", 920000000000, 780000000000, "Hospital"],
    ["factory", "Nha may cong nghe cao Audit Phase 2", "PLANNED", 640000000000, 515000000000, "Industrial factory"],
  ];

  const costTypes = ["material", "labor", "machine", "subcontract", "overhead", "other"];
  const suppliers = [
    "Hoa Phat Steel", "SCG Concrete", "Viglacera Facade", "Coteccons MEP", "Ricons Equipment",
    "An Phong Formwork", "Vinaconex Labor", "DIC Logistics", "Doka Vietnam", "Schneider Electric",
  ];
  const materials = [
    ["M-AUD-STL", "Thep CB400-V", "kg"],
    ["M-AUD-CON", "Be tong thuong pham M350", "m3"],
    ["M-AUD-CEM", "Xi mang PCB40", "tan"],
    ["M-AUD-SAN", "Cat xay to", "m3"],
    ["M-AUD-MEP", "Cap dien chong chay", "m"],
  ];

  await prisma.material.createMany({
    data: materials.map(([code, name, unit]) => ({
      id: `${RUN}_${code}`,
      code: `${RUN}_${code}`,
      name,
      unit,
      updatedAt: now,
      description: "Audit stress-test material",
    })),
    skipDuplicates: true,
  });

  for (let p = 0; p < projectSpecs.length; p++) {
    const [slug, name, status, contractValue, totalBudget, projectType] = projectSpecs[p];
    const projectId = `${RUN}_project_${slug}`;
    await prisma.project.upsert({
      where: { id: projectId },
      update: { status, contractValue, totalBudget, companyId: company.id, branchId: branch.id },
      create: {
        id: projectId,
        name,
        description: `Enterprise audit dataset for ${name}`,
        status,
        contractValue,
        totalBudget,
        companyId: company.id,
        branchId: branch.id,
        ownerId: users[p % users.length].id,
        investor: "Audit Capital Holdings",
        projectType,
        startDate: d(p * 2, 1),
        endDate: d(24 + p * 4, 28),
      },
    });

    const wbs = [];
    for (let phase = 1; phase <= 6; phase++) {
      const parentId = `${RUN}_wbs_${slug}_${phase}`;
      await prisma.wBSItem.upsert({
        where: { id: parentId },
        update: {},
        create: {
          id: parentId,
          projectId,
          code: `${slug.toUpperCase()}.${phase}`,
          name: `Giai doan ${phase} - ${["Chuan bi", "Mong ham", "Ket cau", "MEP", "Hoan thien", "Nghiem thu"][phase - 1]}`,
          level: 0,
          sortOrder: phase,
          budgetAmount: Math.round(totalBudget / 6),
        },
      });
      wbs.push(parentId);

      for (let item = 1; item <= 12; item++) {
        const childId = `${RUN}_wbs_${slug}_${phase}_${item}`;
        await prisma.wBSItem.upsert({
          where: { id: childId },
          update: {},
          create: {
            id: childId,
            projectId,
            parentId,
            code: `${slug.toUpperCase()}.${phase}.${item}`,
            name: `Hang muc ${phase}.${item} audit`,
            level: 1,
            sortOrder: item,
            budgetAmount: Math.round(totalBudget / 72),
          },
        });
        wbs.push(childId);
      }
    }

    await prisma.budgetRecord.createMany({
      data: wbs.slice(0, 48).flatMap((wbsId, i) => costTypes.map((costType, c) => ({
        id: `${RUN}_budget_${slug}_${i}_${c}`,
        projectId,
        wbsId,
        costType,
        estimatedAmount: money(900000000, i + c, (p + 1) * 0.9),
        createdById: users[3].id,
      }))),
      skipDuplicates: true,
    });

    await prisma.bOQItem.createMany({
      data: wbs.slice(6, 66).map((wbsId, i) => {
        const qty = 100 + (i % 19) * 13.75;
        const rate = money(850000, i, p + 1);
        return {
          id: `${RUN}_boq_${slug}_${i}`,
          projectId,
          wbsId,
          description: `BOQ audit ${slug} ${i}`,
          unit: i % 3 === 0 ? "m3" : i % 3 === 1 ? "kg" : "m2",
          quantity: qty,
          unitRate: rate,
          totalAmount: Math.round(qty * rate),
          status: i % 17 === 0 ? "PENDING_REVIEW" : "ACTIVE",
        };
      }),
      skipDuplicates: true,
    });

    await prisma.contract.createMany({
      data: Array.from({ length: 18 }).map((_, i) => ({
        id: `${RUN}_contract_${slug}_${i}`,
        projectId,
        contractNumber: `${RUN}-${slug.toUpperCase()}-CTR-${String(i + 1).padStart(3, "0")}`,
        title: `Hop dong audit ${slug} ${i + 1}`,
        contractorName: suppliers[i % suppliers.length],
        originalValue: money(8500000000, i, p + 1),
        currentValue: money(8900000000, i, p + 1),
        status: i % 9 === 0 ? "DRAFT" : i % 7 === 0 ? "AMENDED" : "ACTIVE",
        signedDate: d(i % 18, 5),
        startDate: d(i % 18, 10),
        endDate: d((i % 18) + 12, 25),
        createdById: users[3].id,
      })),
      skipDuplicates: true,
    });

    const costRows = Array.from({ length: 1800 }).map((_, i) => {
      const amount = i % 173 === 0 ? -money(4000000, i) : money(3500000, i, p + 1);
      const vatRate = i % 127 === 0 ? 8 : 10;
      return {
        id: `${RUN}_cost_${slug}_${i}`,
        projectId,
        wbsId: wbs[i % wbs.length],
        costType: costTypes[i % costTypes.length],
        amount,
        quantity: 1 + (i % 20),
        unitPrice: Math.max(0, Math.round(amount / (1 + (i % 20)))),
        supplier: i % 211 === 0 ? null : suppliers[i % suppliers.length],
        note: i % 199 === 0 ? "EDGE_CASE_NEGATIVE_OR_MISSING_SUPPLIER" : `Audit cost ${slug} ${i}`,
        date: d(i % 24, (i % 27) + 1),
        status: i % 4 === 0 ? "paid" : "unpaid",
        approvalStatus: i % 13 === 0 ? "REJECTED" : i % 5 === 0 ? "PENDING" : "APPROVED",
        vatRate,
        vatAmount: Math.round(amount * vatRate / 100),
        netAmount: amount,
        retentionRate: i % 6 === 0 ? 5 : 0,
        retentionAmount: i % 6 === 0 ? Math.round(amount * 0.05) : 0,
        companyId: company.id,
        branchId: branch.id,
        createdById: users[(i % 4) + 1].id,
        workflowStatus: i % 5 === 0 ? "PENDING_APPROVAL" : "APPROVED",
      };
    });
    for (let i = 0; i < costRows.length; i += 300) {
      await prisma.costRecord.createMany({ data: costRows.slice(i, i + 300), skipDuplicates: true });
    }

    const invoices = Array.from({ length: 180 }).map((_, i) => {
      const amount = money(1200000000, i, p + 1);
      const paidAmount = i % 5 === 0 ? amount : i % 3 === 0 ? Math.round(amount * 0.45) : 0;
      return {
        id: `${RUN}_invoice_${slug}_${i}`,
        projectId,
        wbsId: wbs[i % wbs.length],
        invoiceNumber: `${RUN}-${slug.toUpperCase()}-INV-${String(i + 1).padStart(4, "0")}`,
        amount,
        paidAmount,
        remainingAmount: amount - paidAmount,
        issuedDate: d(i % 24, (i % 25) + 1),
        dueDate: d((i % 24) + 1, (i % 25) + 1),
        status: paidAmount === amount ? "PAID" : paidAmount > 0 ? "PARTIAL" : i % 11 === 0 ? "OVERDUE" : "SENT",
        approvalStatus: i % 6 === 0 ? "PENDING" : "APPROVED",
        vatRate: 10,
        vatAmount: Math.round(amount * 0.1),
        netAmount: amount,
        retentionRate: i % 4 === 0 ? 5 : 0,
        retentionAmount: i % 4 === 0 ? Math.round(amount * 0.05) : 0,
        companyId: company.id,
        branchId: branch.id,
        createdById: users[3].id,
      };
    });
    await prisma.invoice.createMany({ data: invoices, skipDuplicates: true });

    const payments = invoices.filter((inv) => inv.paidAmount > 0).flatMap((inv, i) => {
      const first = Math.round(inv.paidAmount * 0.6);
      const second = inv.paidAmount - first;
      return [
        {
          id: `${RUN}_payment_${slug}_${i}_1`,
          invoiceId: inv.id,
          projectId,
          amount: first,
          date: d((i % 24) + 1, 10),
          description: `Thanh toan dot 1 ${inv.invoiceNumber}`,
          approvalStatus: "APPROVED",
        },
        ...(second > 0 ? [{
          id: `${RUN}_payment_${slug}_${i}_2`,
          invoiceId: inv.id,
          projectId,
          amount: second,
          date: d((i % 24) + 2, 20),
          description: `Thanh toan dot 2 ${inv.invoiceNumber}`,
          approvalStatus: i % 8 === 0 ? "PENDING" : "APPROVED",
        }] : []),
      ];
    });
    await prisma.payment.createMany({ data: payments, skipDuplicates: true });

    await prisma.revenue.createMany({
      data: invoices.map((inv, i) => ({
        id: `${RUN}_revenue_${slug}_${i}`,
        projectId,
        wbsId: inv.wbsId,
        invoiceId: inv.id,
        amount: inv.amount,
        date: inv.issuedDate,
        status: inv.status === "PAID" ? "paid" : "unpaid",
        description: `Revenue linked to ${inv.invoiceNumber}`,
        createdById: users[3].id,
      })),
      skipDuplicates: true,
    });

    await prisma.purchaseRequest.createMany({
      data: Array.from({ length: 80 }).map((_, i) => ({
        id: `${RUN}_pr_${slug}_${i}`,
        projectId,
        wbsId: wbs[i % wbs.length],
        title: `PR audit ${slug} ${i}`,
        requestedBy: users[(i % users.length)].name,
        status: i % 6 === 0 ? "SUBMITTED" : i % 8 === 0 ? "REJECTED" : "APPROVED",
        totalAmount: money(500000000, i, p + 1),
        requestDate: d(i % 24, 4),
        neededBy: d((i % 24) + 1, 18),
        createdById: users[4].id,
      })),
      skipDuplicates: true,
    });

    await prisma.siteLog.createMany({
      data: Array.from({ length: 240 }).map((_, i) => ({
        id: `${RUN}_sitelog_${slug}_${i}`,
        projectId,
        date: d(i % 24, (i % 27) + 1),
        weather: i % 9 === 0 ? "Heavy rain" : "Normal",
        temperature: 28 + (i % 8),
        manpower: 80 + (i % 170),
        equipment: `Tower crane ${i % 6}, excavator ${i % 4}`,
        progress: `${Math.min(100, Math.round((i / 240) * 100))}%`,
        notes: i % 31 === 0 ? "EDGE_CASE_DELAY_WEATHER" : "Daily audit log",
        createdById: users[4].id,
      })),
      skipDuplicates: true,
    });

    await prisma.inventoryTransaction.createMany({
      data: Array.from({ length: 600 }).map((_, i) => ({
        id: `${RUN}_invtx_${slug}_${i}`,
        projectId,
        materialId: `${RUN}_${materials[i % materials.length][0]}`,
        type: i % 10 === 0 ? "ADJUST" : i % 3 === 0 ? "ISSUE" : "RECEIPT",
        quantity: i % 157 === 0 ? -5 : 10 + (i % 90),
        unitPrice: money(90000, i),
        referenceId: `${RUN}_REF_${slug}_${i}`,
        note: i % 157 === 0 ? "EDGE_CASE_NEGATIVE_STOCK_ADJUSTMENT" : "Audit inventory movement",
      })),
      skipDuplicates: true,
    });
  }

  console.log("[enterprise-audit-seed] Dataset completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
