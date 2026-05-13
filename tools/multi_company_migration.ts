import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function migrateToMultiCompany() {
  console.log('--- Multi-Company Migration Started ---');

  // 1. Create Default Company
  const company = await prisma.company.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Construction Group HQ',
      code: 'MAIN',
      address: '123 Enterprise Way',
    }
  });

  // 2. Create Default Branch
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Headquarters',
      code: 'HQ',
      address: '123 Enterprise Way',
    }
  });

  console.log(`Default Company: ${company.id}, Branch: ${branch.id}`);

  // 3. Update Users
  const userUpdate = await prisma.user.updateMany({
    where: { companyId: null },
    data: { companyId: company.id }
  });
  console.log(`Updated ${userUpdate.count} users.`);

  // 4. Update Projects
  const projectUpdate = await prisma.project.updateMany({
    where: { companyId: null },
    data: { companyId: company.id, branchId: branch.id }
  });
  console.log(`Updated ${projectUpdate.count} projects.`);

  // 5. Update Costs & Invoices
  const costUpdate = await prisma.costRecord.updateMany({
    where: { companyId: null },
    data: { companyId: company.id, branchId: branch.id }
  });
  const invoiceUpdate = await prisma.invoice.updateMany({
    where: { companyId: null },
    data: { companyId: company.id, branchId: branch.id }
  });
  console.log(`Updated ${costUpdate.count} costs and ${invoiceUpdate.count} invoices.`);

  console.log('--- Migration Completed ---');
}

migrateToMultiCompany()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
