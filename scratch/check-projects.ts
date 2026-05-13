import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Total projects: ${projects.length}`);
  projects.forEach((p, i) => {
    console.log(`${i + 1}. [${p.id}] ${p.name} (Created: ${p.createdAt})`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
