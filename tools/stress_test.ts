import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function runStressTest() {
  const projectId = 'STRESS_PROJECT';
  console.log(`Starting Stress Test for Project: ${projectId}`);

  // 1. Create Stress Project
  const project = await prisma.project.upsert({
    where: { id: projectId },
    update: {},
    create: {
      id: projectId,
      name: 'Stress Test Project',
      totalBudget: 1000000000,
    }
  });

  let wbs = await prisma.wBSItem.findFirst({ where: { projectId } });
  if (!wbs) {
    wbs = await prisma.wBSItem.create({
      data: {
        projectId,
        name: 'Stress WBS',
        budgetAmount: 1000000000,
      }
    });
  }

  // 2. Insert 5000 records
  console.log('Inserting 5000 records...');
  const data = Array.from({ length: 5000 }).map((_, i) => ({
    projectId,
    wbsId: wbs.id,
    amount: 1000,
    note: `Stress test item ${i}`,
    date: new Date(),
    costType: 'material' as any,
  }));

  const start = Date.now();
  await prisma.costRecord.createMany({ data });
  const end = Date.now();
  console.log(`Insertion took: ${end - start}ms`);

  // 3. Measure Dashboard Stats API speed
  // We'll simulate the dashboard logic
  const aggStart = Date.now();
  const agg = await prisma.costRecord.aggregate({
    where: { projectId, deletedAt: null },
    _sum: { amount: true },
    _count: { id: true }
  });
  const aggEnd = Date.now();
  console.log(`Aggregation of 5000 records took: ${aggEnd - aggStart}ms`);
  console.log(`Total Count: ${agg._count.id}, Total Amount: ${agg._sum.amount}`);

  console.log('Stress test completed.');
}

runStressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
