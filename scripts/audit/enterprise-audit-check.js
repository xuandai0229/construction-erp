const { PrismaClient } = require("../generated/prisma-client");

const prisma = new PrismaClient();

async function main() {
  const [
    users,
    companies,
    branches,
    projects,
    wbs,
    budgets,
    boq,
    costs,
    invoices,
    payments,
    revenues,
    contracts,
    prs,
    materials,
    inventory,
    siteLogs,
    journals,
    lines,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.branch.count(),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.wBSItem.count({ where: { deletedAt: null } }),
    prisma.budgetRecord.count({ where: { deletedAt: null } }),
    prisma.bOQItem.count({ where: { deletedAt: null } }),
    prisma.costRecord.count({ where: { deletedAt: null } }),
    prisma.invoice.count({ where: { deletedAt: null } }),
    prisma.payment.count({ where: { deletedAt: null } }),
    prisma.revenue.count({ where: { deletedAt: null } }),
    prisma.contract.count({ where: { deletedAt: null } }),
    prisma.purchaseRequest.count({ where: { deletedAt: null } }),
    prisma.material.count(),
    prisma.inventoryTransaction.count(),
    prisma.siteLog.count(),
    prisma.journalEntry.count({ where: { deletedAt: null } }),
    prisma.transactionLine.count({ where: { deletedAt: null } }),
  ]);

  const invoiceSample = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: { payments: { where: { deletedAt: null } } },
    take: 1000,
  });
  const badInvoices = invoiceSample.filter((inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return Math.abs(Number(inv.remainingAmount) - Math.max(0, Number(inv.amount) - paid)) > 0.01;
  });
  const overpaidInvoices = invoiceSample.filter((inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return paid - Number(inv.amount) > 0.01;
  });

  const vatSample = await prisma.costRecord.findMany({ where: { deletedAt: null }, take: 5000 });
  const badVat = vatSample.filter((c) => {
    return Math.abs(Number(c.amount) - (Number(c.netAmount) + Number(c.vatAmount))) > 1;
  });

  const negativeCosts = await prisma.costRecord.count({ where: { amount: { lt: 0 }, deletedAt: null } });
  const missingSupplier = await prisma.costRecord.count({ where: { supplier: null, deletedAt: null } });
  const negativeInventory = await prisma.inventoryTransaction.count({ where: { quantity: { lt: 0 } } });

  const journalRows = await prisma.journalEntry.findMany({
    where: { deletedAt: null },
    include: { lines: true },
    take: 5000,
  });
  const unbalanced = journalRows.filter((entry) => {
    const debit = entry.lines.filter((l) => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
    const credit = entry.lines.filter((l) => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
    return Math.abs(debit - credit) > 0.01;
  });

  const orphanCostWbs = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "CostRecord" c
    LEFT JOIN "WBSItem" w ON w.id = c."wbsId"
    WHERE c."deletedAt" IS NULL AND w.id IS NULL
  `;

  const orphanInvoiceWbs = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "Invoice" i
    LEFT JOIN "WBSItem" w ON w.id = i."wbsId"
    WHERE i."deletedAt" IS NULL AND w.id IS NULL
  `;

  console.log(JSON.stringify({
    counts: {
      users,
      companies,
      branches,
      projects,
      wbs,
      budgets,
      boq,
      costs,
      invoices,
      payments,
      revenues,
      contracts,
      purchaseRequests: prs,
      materials,
      inventoryTransactions: inventory,
      siteLogs,
      journalEntries: journals,
      transactionLines: lines,
    },
    integrity: {
      invoiceSampleSize: invoiceSample.length,
      badInvoiceRemainingAmount: badInvoices.length,
      overpaidInvoices: overpaidInvoices.length,
      vatSampleSize: vatSample.length,
      badVatRows: badVat.length,
      negativeCosts,
      missingSupplier,
      negativeInventory,
      sampledJournalEntries: journalRows.length,
      unbalancedJournalEntries: unbalanced.length,
      orphanCostWbs: orphanCostWbs[0]?.count ?? null,
      orphanInvoiceWbs: orphanInvoiceWbs[0]?.count ?? null,
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
