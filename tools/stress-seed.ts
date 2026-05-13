import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function stressSeed() {
  console.log('--- STARTING STRESS SEED ---');

  // 1. Create 5 Projects
  const projects = [];
  for (let i = 1; i <= 5; i++) {
    const p = await prisma.project.create({
      data: {
        name: `Dự án Đại đô thị ${i}`,
        description: `Dự án quy mô lớn số ${i} với hàng nghìn hạng mục.`,
        status: i % 2 === 0 ? 'IN_PROGRESS' : 'PLANNED',
        contractValue: 500000000000 * i, // 500B * i
        totalBudget: 450000000000 * i,
        startDate: new Date('2024-01-01'),
        investor: i % 2 === 0 ? 'Vingroup' : 'Sun Group',
        projectType: 'Hạ tầng / Cao tầng',
      }
    });
    projects.push(p);
  }

  // 2. Create WBS for each project
  for (const p of projects) {
    const wbsItems = [];
    for (let j = 1; j <= 10; j++) {
      const w = await prisma.wBSItem.create({
        data: {
          projectId: p.id,
          name: `Hạng mục chính ${j}`,
          code: `WBS-${j}`,
          budgetAmount: 10000000000,
        }
      });
      wbsItems.push(w);
    }

    // 3. Create 100 Cost Records for each project
    console.log(`Generating 100 costs for project: ${p.name}`);
    const costTypes = ['material', 'labor', 'equipment', 'subcontractor', 'other'];
    const suppliers = ['Hòa Phát', 'Vinaconex', 'Coteccons', 'Delta', 'Ricons'];
    
    const costsData = [];
    for (let k = 1; k <= 100; k++) {
      const amount = Math.floor(Math.random() * 500000000) + 10000000;
      costsData.push({
        projectId: p.id,
        wbsId: wbsItems[k % 10].id,
        amount,
        costType: costTypes[k % 5] as any,
        supplier: suppliers[k % 5],
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        status: k % 3 === 0 ? 'unpaid' : 'paid',
        note: `Chi phí thanh toán đợt ${k} - Gói thầu ${k % 5}`,
        workflowStatus: k % 10 === 0 ? 'DRAFT' : 'POSTED',
      });
    }
    await prisma.costRecord.createMany({ data: costsData });
  }

  console.log('--- STRESS SEED COMPLETED ---');
}

stressSeed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
