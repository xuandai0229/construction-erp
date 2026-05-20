const { PrismaClient } = require("../generated/prisma-client");
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.costRecord.findFirst({
    where: { deletedAt: null }
  });
  console.log("Cost record keys:", Object.keys(c));
  console.log("Cost record:", JSON.stringify(c, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
