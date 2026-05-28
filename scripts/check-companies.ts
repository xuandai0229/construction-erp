import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const companies = await prisma.company.findMany();
  console.log("COMPANIES:", companies.map(c => ({ id: c.id, name: c.name })));

  const invoices = await prisma.invoice.findMany({ take: 5 });
  console.log("INVOICES:", invoices.map(i => ({ id: i.id, companyId: i.companyId })));
}

run().finally(() => prisma.$disconnect());
