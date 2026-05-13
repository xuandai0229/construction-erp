import { prisma } from "./lib/prisma";
import { seedChartOfAccounts } from "./lib/accounting/chartOfAccounts";

async function main() {
  console.log("Seeding ERP Core data...");
  
  await prisma.$transaction(async (tx) => {
    await seedChartOfAccounts(tx);
  });
  
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
