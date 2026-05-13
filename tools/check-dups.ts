import { prisma } from '../lib/prisma';

async function checkDuplicates() {
  console.log("Checking for duplicate JournalEntries...");
  const dups: any[] = await prisma.$queryRaw`
    SELECT "sourceType", "sourceId", COUNT(*) 
    FROM "JournalEntry" 
    WHERE "deletedAt" IS NULL 
    GROUP BY "sourceType", "sourceId" 
    HAVING COUNT(*) > 1
  `;
  
  if (dups.length > 0) {
    console.error("CRITICAL: Duplicate JournalEntries found!", dups);
  } else {
    console.log("No active duplicates found.");
  }
}

checkDuplicates().catch(console.error).finally(() => prisma.$disconnect());
