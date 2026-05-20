import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log("All projects in DB:");
  projects.forEach((p: any) => {
    console.log(`- Project: ${p.name}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Company ID: ${p.companyId}`);
    console.log(`  Contract Value: ${p.contractValue}`);
    console.log(`  Budget: ${p.totalBudget}`);
  });
}

main().finally(() => prisma.$disconnect());
