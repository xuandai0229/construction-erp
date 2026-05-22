const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  console.log('--- TEST DATA SETUP ---');
  // 1. Create a Project
  const project = await prisma.project.create({
    data: {
      name: 'AUDIT PROJECT',
      status: 'PLANNING',
      totalBudget: 1500000000,
      startDate: new Date(),
      endDate: new Date()
    }
  });
  console.log('Project created:', project.id);

  // 2. Create a WBS Item
  const wbs = await prisma.wBSItem.create({
    data: {
      name: 'WBS-PHASE-1',
      projectId: project.id,
      budget: 1500000000,
      actual: 0
    }
  });
  console.log('WBS created:', wbs.id);

  // 3. Create Budget Records for Phase 3
  const recordsData = [
    { projectId: project.id, wbsId: wbs.id, costType: 'material', estimatedAmount: 100000000 },
    { projectId: project.id, wbsId: wbs.id, costType: 'labor', estimatedAmount: 200000000 },
    { projectId: project.id, wbsId: wbs.id, costType: 'equipment', estimatedAmount: 300000000 },
    { projectId: project.id, wbsId: wbs.id, costType: 'subcontractor', estimatedAmount: 400000000 },
    { projectId: project.id, wbsId: wbs.id, costType: 'other', estimatedAmount: 500000000 },
  ];
  
  await prisma.budgetRecord.createMany({ data: recordsData });
  console.log('5 BudgetRecords created.');

  console.log('\n--- PHASE 1: DB AUDIT ---');
  const total = await prisma.budgetRecord.count();
  console.log('Total BudgetRecords:', total);

  const byCostType = await prisma.budgetRecord.groupBy({
    by: ['costType'],
    _count: { _all: true },
    _sum: { estimatedAmount: true }
  });
  console.log('By CostType:', JSON.stringify(byCostType, null, 2));

  // Edit record
  const allRecords = await prisma.budgetRecord.findMany();
  const recordToEdit = allRecords[1]; // labor
  const recordToDelete = allRecords[2]; // equipment

  console.log('\n--- PHASE 4: CRUD FORENSIC TEST ---');
  // EDIT
  const edited = await prisma.budgetRecord.update({
    where: { id: recordToEdit.id },
    data: { estimatedAmount: 250000000 }
  });
  console.log('Edited record (Labor):', edited.estimatedAmount);

  // DELETE
  await prisma.budgetRecord.delete({ where: { id: recordToDelete.id } });
  console.log('Deleted record (Equipment):', recordToDelete.id);

  const afterDeleteCount = await prisma.budgetRecord.count();
  console.log('Total records after delete:', afterDeleteCount);
  
  const finalCostType = await prisma.budgetRecord.groupBy({
    by: ['costType'],
    _count: { _all: true },
    _sum: { estimatedAmount: true }
  });
  console.log('Final by CostType:', JSON.stringify(finalCostType, null, 2));

  console.log('--- DB AUDIT END ---');
}
runAudit().catch(console.error).finally(() => prisma.$disconnect());
