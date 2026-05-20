import { PrismaClient } from "../generated/prisma-client";
const prisma = new PrismaClient();

async function main() {
  const periods = await prisma.fiscalPeriod.findMany();
  console.log("All fiscal periods:");
  console.log(JSON.stringify(periods, null, 2));
}

main().finally(() => prisma.$disconnect());
