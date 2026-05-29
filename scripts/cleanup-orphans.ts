import { PrismaClient } from "../generated/prisma-client";
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up left-over test journals...");
  
  // Find orphan test journal entries containing TEST_TAX_GUARDS description or reference like VAT-
  const list = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { description: { contains: "đổi" } },
        { description: { contains: "Đảo bút toán hóa đơn" } },
        { description: { contains: "Ghi sổ hóa đơn VAT" } },
        { reference: { startsWith: "VAT-" } },
        { reference: { startsWith: "REV-" } }
      ]
    }
  });

  console.log(`Found ${list.length} left-over test entries. Cleaning up...`);
  for (const item of list) {
    await prisma.transactionLine.deleteMany({ where: { journalEntryId: item.id } });
    await prisma.journalEntry.delete({ where: { id: item.id } });
  }

  console.log("Cleanup done!");
}

main().catch(console.error);
