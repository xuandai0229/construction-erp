import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 3 Sandbox...');

  // 1. Cleanup old sandbox data if exists
  await prisma.supplier.deleteMany({ where: { code: { startsWith: 'SBX-NCC' } } });
  await prisma.project.deleteMany({ where: { OR: [{ id: 'SBX-CT-001' }, { name: { contains: 'sandbox', mode: 'insensitive' } }] } });

  // 2. Create Project
  const project = await prisma.project.create({
    data: {
      id: 'SBX-CT-001',
      name: 'Công trình sandbox kiểm thử luồng kế toán xây dựng',
      description: 'Sandbox Data',
      investor: 'Chủ đầu tư sandbox',
      status: 'ACTIVE',
      contractValue: 1000000000,
      totalBudget: 800000000,
    }
  });
  console.log(`Created Project: ${project.id} - ${project.name}`);

  // 3. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: { code: 'SBX-NCC-001', name: 'Nhà cung cấp vật tư sandbox', description: 'SANDBOX' }
  });
  const supplier2 = await prisma.supplier.create({
    data: { code: 'SBX-NCC-002', name: 'Nhà thầu nhân công sandbox', description: 'SANDBOX' }
  });
  console.log(`Created Suppliers: ${supplier1.code}, ${supplier2.code}`);

  // 4. Create Contracts
  const contractInvestor = await prisma.contract.create({
    data: {
      projectId: project.id,
      contractNumber: 'SBX-HD-CDT',
      title: 'Hợp đồng chủ đầu tư sandbox',
      originalValue: 1000000000,
      currentValue: 1000000000,
      status: 'ACTIVE',
    }
  });

  const contractVendor = await prisma.contract.create({
    data: {
      projectId: project.id,
      supplierId: supplier1.id,
      contractNumber: 'SBX-HD-NCC1',
      title: 'Hợp đồng vật tư sandbox',
      originalValue: 500000000,
      currentValue: 500000000,
      status: 'ACTIVE',
    }
  });
  console.log(`Created Contracts: ${contractInvestor.contractNumber}, ${contractVendor.contractNumber}`);

  // 5. Create WBS
  const wbsParent1 = await prisma.wBSItem.create({
    data: { projectId: project.id, name: 'Phần móng', code: 'SBX-WBS-01', budgetAmount: 300000000 }
  });
  const wbsChild1 = await prisma.wBSItem.create({
    data: { projectId: project.id, parentId: wbsParent1.id, name: 'Đào đất', code: 'SBX-WBS-01.1', budgetAmount: 100000000 }
  });
  const wbsChild2 = await prisma.wBSItem.create({
    data: { projectId: project.id, parentId: wbsParent1.id, name: 'Bê tông móng', code: 'SBX-WBS-01.2', budgetAmount: 200000000 }
  });

  const wbsParent2 = await prisma.wBSItem.create({
    data: { projectId: project.id, name: 'Phần thân', code: 'SBX-WBS-02', budgetAmount: 500000000 }
  });
  const wbsChild3 = await prisma.wBSItem.create({
    data: { projectId: project.id, parentId: wbsParent2.id, name: 'Cột tầng 1', code: 'SBX-WBS-02.1', budgetAmount: 200000000 }
  });
  console.log(`Created WBS items`);

  // 6. Create Budgets
  await prisma.budgetRecord.create({ data: { projectId: project.id, wbsId: wbsChild1.id, costType: 'material', estimatedAmount: 100000000 } });
  await prisma.budgetRecord.create({ data: { projectId: project.id, wbsId: wbsChild2.id, costType: 'material', estimatedAmount: 200000000 } });
  await prisma.budgetRecord.create({ data: { projectId: project.id, wbsId: wbsChild3.id, costType: 'labor', estimatedAmount: 200000000 } });
  console.log(`Created Budget Records`);

  // 7. Create Acceptances (Nghiệm thu / khối lượng)
  const acceptance = await prisma.acceptance.create({
    data: {
      contractId: contractVendor.id,
      acceptanceNumber: 'SBX-NT-001',
      amount: 150000000,
      note: 'Nghiệm thu sandbox đợt 1',
    }
  });
  console.log(`Created Acceptance: ${acceptance.acceptanceNumber}`);

  console.log('Sandbox Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
