import { prisma } from "../lib/prisma";

async function run() {
  const sourceIds = ['6d2636c1-5115-46ae-9854-16fac39f62d5', '572d2e40-ce1e-4059-9934-d78734f49c58'];
  const journals = await prisma.journalEntry.findMany({
    where: { sourceId: { in: sourceIds } },
    include: { lines: true }
  });

  console.log("Found Journals:");
  journals.forEach(j => {
    console.log(`- ID: ${j.id}, Reference: ${j.reference}, SourceType: ${j.sourceType}, SourceId: ${j.sourceId}, Date: ${j.date}`);
    j.lines.forEach(l => {
      console.log(`  - Line: Account ${l.accountId}, Amount ${l.amount}, Type ${l.type}`);
    });
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
