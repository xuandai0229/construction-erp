
const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function check() {
  try {
    const total = await prisma.project.count();
    const active = await prisma.project.count({ where: { deletedAt: null } });
    const deleted = await prisma.project.findMany({ where: { NOT: { deletedAt: null } }, select: { id: true, name: true, deletedAt: true } });
    
    console.log('Total projects:', total);
    console.log('Active projects:', active);
    console.log('Deleted projects:', JSON.stringify(deleted, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
