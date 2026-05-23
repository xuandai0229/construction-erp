const { PrismaClient } = require('../generated/prisma-client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  const projectId = '4aad30c2-4619-4c46-99ef-0dce184460b5';
  
  const action = process.argv[2] || 'seed';
  const targetCount = parseInt(process.argv[3]) || 1000;

  if (action === 'cleanup') {
    console.log('Cleaning up stress test WBS items...');
    const result = await prisma.wBSItem.deleteMany({
      where: {
        projectId,
        name: { startsWith: 'STRESS_' }
      }
    });
    console.log(`Cleaned up ${result.count} stress items.`);
    return;
  }

  console.log(`Seeding ${targetCount} hierarchical WBS items for project ${projectId}...`);

  // Generate levels based on targetCount
  const wbsItems = [];
  
  let currentCount = 0;
  const level0Count = Math.min(10, targetCount);
  const level0Items = [];
  
  for (let i = 0; i < level0Count; i++) {
    const id = crypto.randomUUID();
    level0Items.push({
      id,
      projectId,
      name: `STRESS_L0_${i}`,
      parentId: null,
      level: 0,
      code: `S.${i}`,
      sortOrder: i,
      budgetAmount: 1000000
    });
    currentCount++;
  }
  
  const level1Items = [];
  if (currentCount < targetCount) {
    const level1PerParent = Math.ceil((targetCount - currentCount) / level0Count);
    for (const parent of level0Items) {
      if (currentCount >= targetCount) break;
      const countForThisParent = Math.min(level1PerParent, targetCount - currentCount);
      for (let i = 0; i < countForThisParent; i++) {
        const id = crypto.randomUUID();
        level1Items.push({
          id,
          projectId,
          name: `STRESS_L1_${parent.name.split('_')[2]}_${i}`,
          parentId: parent.id,
          level: 1,
          code: `${parent.code}.${i}`,
          sortOrder: i,
          budgetAmount: 200000
        });
        currentCount++;
      }
    }
  }

  const level2Items = [];
  if (currentCount < targetCount) {
    const level2PerParent = Math.ceil((targetCount - currentCount) / level1Items.length);
    for (const parent of level1Items) {
      if (currentCount >= targetCount) break;
      const countForThisParent = Math.min(level2PerParent, targetCount - currentCount);
      for (let i = 0; i < countForThisParent; i++) {
        const id = crypto.randomUUID();
        level2Items.push({
          id,
          projectId,
          name: `STRESS_L2_${parent.name.split('_').slice(2).join('_')}_${i}`,
          parentId: parent.id,
          level: 2,
          code: `${parent.code}.${i}`,
          sortOrder: i,
          budgetAmount: 50000
        });
        currentCount++;
      }
    }
  }

  const level3Items = [];
  if (currentCount < targetCount) {
    const level3PerParent = Math.ceil((targetCount - currentCount) / level2Items.length);
    for (const parent of level2Items) {
      if (currentCount >= targetCount) break;
      const countForThisParent = Math.min(level3PerParent, targetCount - currentCount);
      for (let i = 0; i < countForThisParent; i++) {
        const id = crypto.randomUUID();
        level3Items.push({
          id,
          projectId,
          name: `STRESS_L3_${parent.name.split('_').slice(2).join('_')}_${i}`,
          parentId: parent.id,
          level: 3,
          code: `${parent.code}.${i}`,
          sortOrder: i,
          budgetAmount: 10000
        });
        currentCount++;
      }
    }
  }

  const allItems = [...level0Items, ...level1Items, ...level2Items, ...level3Items];
  console.log(`Generated ${allItems.length} WBS items. Committing to database...`);
  
  const start = Date.now();
  
  await prisma.$transaction([
    prisma.wBSItem.createMany({ data: level0Items }),
    prisma.wBSItem.createMany({ data: level1Items }),
    prisma.wBSItem.createMany({ data: level2Items }),
    prisma.wBSItem.createMany({ data: level3Items })
  ]);
  
  const end = Date.now();
  console.log(`Successfully seeded ${allItems.length} hierarchical WBS items in ${end - start}ms.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
