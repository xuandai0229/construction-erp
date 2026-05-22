const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const p = await prisma.project.findFirst();
  if (!p) { console.log('NO PROJECTS'); return; }
  
  const wbs = await prisma.wBSItem.create({
    data: {
      name: 'WBS-PHASE-TEST',
      projectId: p.id,
      budgetAmount: 1500000000,
    }
  });

  const recordsData = [
    { projectId: p.id, wbsId: wbs.id, costType: 'material', estimatedAmount: 100000000 },
    { projectId: p.id, wbsId: wbs.id, costType: 'labor', estimatedAmount: 200000000 },
    { projectId: p.id, wbsId: wbs.id, costType: 'machine', estimatedAmount: 300000000 },
    { projectId: p.id, wbsId: wbs.id, costType: 'subcontract', estimatedAmount: 400000000 },
    { projectId: p.id, wbsId: wbs.id, costType: 'other', estimatedAmount: 500000000 },
  ];
  await prisma.budgetRecord.createMany({ data: recordsData });

  const total = await prisma.budgetRecord.count();
  console.log('Total BudgetRecords:', total);

  const byCostType = await prisma.budgetRecord.groupBy({
    by: ['costType'],
    _count: { _all: true },
    _sum: { estimatedAmount: true }
  });
  console.log('By CostType:', JSON.stringify(byCostType, null, 2));

  const allRecords = await prisma.budgetRecord.findMany({ where: { wbsId: wbs.id } });
  const recordToEdit = allRecords[1]; // labor
  const recordToDelete = allRecords[2]; // equipment

  const edited = await prisma.budgetRecord.update({
    where: { id: recordToEdit.id },
    data: { estimatedAmount: 250000000 }
  });
  console.log('Edited record (Labor) to:', edited.estimatedAmount);

  await prisma.budgetRecord.delete({ where: { id: recordToDelete.id } });
  console.log('Deleted record (Equipment)');

  const finalCostType = await prisma.budgetRecord.groupBy({
    by: ['costType'],
    _count: { _all: true },
    _sum: { estimatedAmount: true }
  });
  console.log('Final by CostType:', JSON.stringify(finalCostType, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
