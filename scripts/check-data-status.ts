import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const projects = await prisma.project.count();
  const costs = await prisma.costRecord.count();
  const users = await prisma.user.count();
  console.log('--- DATA STATUS ---');
  console.log('Projects:', projects);
  console.log('Costs:', costs);
  console.log('Users:', users);
  console.log('-------------------');
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
