import { prisma } from '@/lib/prisma';

async function verifyAccounting() {
  console.log("--- STARTING ACCOUNTING HARDENING VERIFICATION ---");

  // 1. Create a Journal Entry
  const je = await prisma.journalEntry.create({
    data: {
      date: new Date(),
      description: "Verification Entry",
    }
  });
  console.log(`Created Journal Entry: ${je.id}`);

  // 2. Attempt to DELETE (Should FAIL)
  try {
    await prisma.journalEntry.delete({ where: { id: je.id } });
    console.error("FAIL: Journal Entry deletion allowed!");
  } catch (e: any) {
    console.log(`SUCCESS: Deletion blocked: ${e.message}`);
  }

  // 3. Attempt to UPDATE description (Should FAIL)
  try {
    await prisma.journalEntry.update({
      where: { id: je.id },
      data: { description: "Illegal Update" }
    });
    console.error("FAIL: Journal Entry update allowed!");
  } catch (e: any) {
    console.log(`SUCCESS: Update blocked: ${e.message}`);
  }

  // 4. Attempt to UPDATE reversal flag (Should SUCCEED)
  try {
    await prisma.journalEntry.update({
      where: { id: je.id },
      data: { isReversed: true }
    });
    console.log("SUCCESS: Reversal flag update allowed.");
  } catch (e: any) {
    console.error(`FAIL: Reversal flag update blocked: ${e.message}`);
  }

  console.log("--- ACCOUNTING VERIFICATION COMPLETED ---");
}

verifyAccounting().catch(console.error).finally(() => prisma.$disconnect());
