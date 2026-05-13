import { prisma } from '../lib/prisma';

async function hardenIndex() {
  console.log("Applying Partial Unique Index to JournalEntry...");
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_journal 
    ON "JournalEntry" ("sourceType", "sourceId") 
    WHERE "deletedAt" IS NULL
  `);
  console.log("SUCCESS: Partial Unique Index applied.");
}

hardenIndex().catch(console.error).finally(() => prisma.$disconnect());
