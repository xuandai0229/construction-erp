import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Pilot Data Simulation...');

  // 1. Create a Primary Project
  const project = await prisma.project.create({
    data: {
      name: 'Pilot: Vinhomes Grand Park - Tower L1',
      description: 'Dự án thí điểm thực tế cho tháp L1, bao gồm kết cấu và hoàn thiện.',
      status: 'IN_PROGRESS',
      contractValue: 150000000000, // 150B VND
      totalBudget: 120000000000,   // 120B VND
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-06-30'),
    }
  });

  // 2. Create WBS Structure
  const wbsHầm = await prisma.wBSItem.create({
    data: {
      projectId: project.id,
      name: 'Hầm & Móng',
      code: 'FND',
      budgetAmount: 30000000000
    }
  });

  const wbsThân = await prisma.wBSItem.create({
    data: {
      projectId: project.id,
      name: 'Kết cấu Thân',
      code: 'STR',
      budgetAmount: 70000000000
    }
  });

  // 3. Create BOQ Items
  await prisma.bOQItem.createMany({
    data: [
      { projectId: project.id, wbsId: wbsHầm.id, description: 'Bê tông móng M300', unit: 'm3', quantity: 5000, unitRate: 1500000, totalAmount: 7500000000 },
      { projectId: project.id, wbsId: wbsThân.id, description: 'Cốt thép cột sàn', unit: 'kg', quantity: 1200000, unitRate: 18000, totalAmount: 21600000000 },
    ]
  });

  // 4. Simulate Costs over 6 months
  const months = [1, 2, 3, 4, 5, 6];
  for (const m of months) {
    const date = new Date(`2024-0${m}-15`);
    await prisma.costRecord.create({
      data: {
        projectId: project.id,
        wbsId: wbsHầm.id,
        amount: 2000000000 + (m * 500000000), // Growth
        costType: 'material',
        supplier: 'Hòa Phát Steel',
        date,
        status: 'paid',
        note: `Chi phí thép tháng ${m}`,
        vatRate: 10,
        vatAmount: (2000000000 + (m * 500000000)) * 0.1,
        netAmount: (2000000000 + (m * 500000000)) * 0.9,
      }
    });
  }

  // 5. Simulate Variation Order
  await prisma.variationOrder.create({
    data: {
      projectId: project.id,
      wbsId: wbsThân.id,
      title: 'Bổ sung thép dầm sàn tầng 15',
      amount: 450000000,
      status: 'APPROVED',
      type: 'ADDITION'
    }
  });

  console.log('Pilot Data Simulation Completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
