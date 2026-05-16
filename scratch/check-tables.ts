import { prisma } from "../lib/prisma";

async function check() {
  const tables: any = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log(tables.map((t: any) => t.table_name));
}

check().catch(console.error).finally(() => prisma.$disconnect());
