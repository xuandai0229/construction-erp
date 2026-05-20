const { PrismaClient } = require("../generated/prisma-client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  const companyId = company ? company.id : "COMPANY_SYSTEM_WIDE";

  console.log(`Seeding locked fiscal period for company ID: ${companyId}...`);
  await prisma.fiscalPeriod.upsert({
    where: { month: "2025-12" },
    update: {
      isLocked: true,
      name: "Kỳ kế toán tháng 12/2025 (Đã đóng)",
      companyId: companyId
    },
    create: {
      month: "2025-12",
      isLocked: true,
      name: "Kỳ kế toán tháng 12/2025 (Đã đóng)",
      companyId: companyId
    }
  });

  console.log("✅ Seeded locked fiscal period successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
