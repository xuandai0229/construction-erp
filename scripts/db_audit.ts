import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const p = await prisma.project.findFirst({ 
    where: { name: { contains: 'Vinhomes Ocean' } },
    include: { wbsItems: true } 
  });
  console.log(JSON.stringify(p, null, 2));
}
run();
