import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (company) {
    await prisma.project.update({
      where: { id: 'SBX-CT-001' },
      data: { companyId: company.id }
    });
    console.log('Fixed project companyId', company.id);
  }
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
