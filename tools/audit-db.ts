import { prisma } from '@/lib/prisma';

async function auditDatabase() {
  console.log("=== ENTERPRISE DATABASE SCALABILITY AUDIT ===");

  // 1. Audit Indexes
  console.log("\n[PHASE 1] INDEX AUDIT");
  const indexes = await prisma.$queryRaw`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('Project', 'CostRecord', 'Invoice', 'Payment', 'WBSItem', 'Task', 'JournalEntry', 'TransactionLine')
    ORDER BY tablename;
  `;
  console.table(indexes);

  // 2. Audit Table Sizes (Estimated)
  console.log("\n[PHASE 2] TABLE SIZE AUDIT");
  const sizes = await prisma.$queryRaw`
    SELECT relname as tablename, n_live_tup as estimated_rows 
    FROM pg_stat_user_tables 
    WHERE relname IN ('Project', 'CostRecord', 'Invoice', 'Payment', 'WBSItem', 'Task', 'JournalEntry', 'TransactionLine')
    ORDER BY n_live_tup DESC;
  `;
  console.table(sizes);

  // 3. Analyze Execution Plans for Critical Queries
  console.log("\n[PHASE 3] EXPLAIN ANALYZE - AGGREGATE COSTS");
  // We use a dummy UUID if none exists
  const sampleProjectId = "ef2f3ce5-af09-49fd-80c0-d192ebde4af8"; 
  
  try {
    const explainCost = await prisma.$queryRawUnsafe(`
      EXPLAIN ANALYZE 
      SELECT SUM(amount) 
      FROM "CostRecord" 
      WHERE "projectId" = '${sampleProjectId}' AND "deletedAt" IS NULL;
    `);
    console.log("Cost Aggregate Plan:");
    console.log(JSON.stringify(explainCost, null, 2));
  } catch (e) {
    console.log("Could not run explain (missing project data?)");
  }

  // 4. Check for Bloat or Slow Sequential Scans
  console.log("\n[PHASE 4] SEQUENTIAL SCAN AUDIT");
  const seqScans = await prisma.$queryRaw`
    SELECT relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY seq_scan DESC;
  `;
  console.table(seqScans);
}

auditDatabase().catch(console.error).finally(() => prisma.$disconnect());
