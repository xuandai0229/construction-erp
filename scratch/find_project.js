const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findFirst();
  console.log(p);
}
main().catch(console.error).finally(() => prisma.$disconnect());
