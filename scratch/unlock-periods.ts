import { PrismaClient } from "../generated/prisma-client";
const prisma = new PrismaClient();

async function main() {
  console.log("Unlocking all fiscal periods in database...");
  const result = await prisma.fiscalPeriod.updateMany({
    data: {
      isLocked: false
    }
  });
  console.log("SUCCESS! Unlocked periods:", result.count);
}

main().finally(() => prisma.$disconnect());
