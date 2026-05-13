import { PrismaClient } from '../generated/prisma-client';

const prisma = new PrismaClient();

async function verifyLedgerIntegrity() {
  console.log('--- STARTING LEDGER INTEGRITY VERIFICATION ---');

  // 1. Check unbalanced Journal Entries
  console.log('1. Checking for unbalanced Journal Entries...');
  const entries = await prisma.journalEntry.findMany({
    include: { lines: true }
  });

  let unbalancedCount = 0;
  for (const entry of entries) {
    const debits = entry.lines
      .filter(l => l.type === 'DEBIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);
    const credits = entry.lines
      .filter(l => l.type === 'CREDIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);

    if (Math.abs(debits - credits) > 0.01) {
      console.error(`[UNBALANCED] Entry ${entry.id} (${entry.reference}): Debit=${debits}, Credit=${credits}`);
      unbalancedCount++;
    }
  }

  // 2. Check duplicate requestIds in CostRecord
  console.log('2. Checking for duplicate requestIds in CostRecord...');
  const duplicateRequests = await prisma.$queryRaw`
    SELECT "requestId", COUNT(*) 
    FROM "CostRecord" 
    WHERE "requestId" IS NOT NULL 
    GROUP BY "requestId" 
    HAVING COUNT(*) > 1
  `;
  
  if ((duplicateRequests as any[]).length > 0) {
    console.error(`[DUPLICATE REQUESTS] Found duplicate requestIds:`, duplicateRequests);
  }

  // 3. Check for orphaned Transaction Lines
  console.log('3. Checking for orphaned Transaction Lines...');
  const orphanLines = await prisma.transactionLine.findMany({
    where: {
      journalEntryId: {
        notIn: entries.map(e => e.id)
      }
    }
  });

  if (orphanLines.length > 0) {
    console.error(`[ORPHAN LINES] Found ${orphanLines.length} lines without a valid JournalEntry`);
  }

  // 4. Check for CostRecords without JournalEntries (if POSTED)
  console.log('4. Checking for POSTED CostRecords without JournalEntries...');
  const postedCosts = await prisma.costRecord.findMany({
    where: { workflowStatus: 'POSTED', deletedAt: null }
  });

  for (const cost of postedCosts) {
    const journal = await prisma.journalEntry.findFirst({
      where: { sourceId: cost.id, sourceType: 'COST' }
    });
    if (!journal) {
      console.error(`[MISSING JOURNAL] CostRecord ${cost.id} is POSTED but has no JournalEntry`);
    }
  }

  console.log('--- VERIFICATION COMPLETE ---');
  console.log(`Unbalanced: ${unbalancedCount}`);
  console.log(`Orphan Lines: ${orphanLines.length}`);
}

verifyLedgerIntegrity()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
