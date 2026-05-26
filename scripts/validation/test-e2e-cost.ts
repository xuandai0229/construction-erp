import { CostService } from "../services/cost.service";
import { PostingEngine } from "../lib/accounting/postingEngine";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("Starting E2E Cost Flow Test...");
  const requestId = "e2e-cost-" + Date.now();
  
  // 1. Create Cost
  console.log("\n--- Step 1: Create Cost ---");
  const cost = await CostService.create({
    projectId: "2fa9e808-761f-4532-8d0c-85e748aaaeb4", // Valid project
    wbsId: "73533917-034d-4a2a-ba6d-968b783ba55b",     // Valid WBS
    costType: "material" as any,
    amount: 5000000,
    vatRate: 10,
    retentionRate: 5,
    requestId,
    note: "E2E Test Cost",
    status: "unpaid"
  });
  console.log(`✅ Cost created: ${cost.id}, Status: ${cost.workflowStatus}`);
  
  // Verify Ledger: DRAFT should NOT have a journal entry yet (unless we changed the rule to post on creation. Let's check).
  let journal = await prisma.journalEntry.findFirst({ where: { sourceId: cost.id } });
  if (journal) {
    console.log(`⚠️ Warning: Journal created for DRAFT cost. (${journal.id})`);
  } else {
    console.log(`✅ Verified: No journal entry for DRAFT cost.`);
  }

  // 2. Approve Cost
  console.log("\n--- Step 2: Approve Cost ---");
  const approvedCost = await CostService.transition(cost.id, "APPROVED", { userId: "65e9cf9f-f6d6-4a9b-b42c-fbbeffcb65d8" });
  console.log(`✅ Cost approved, Status: ${approvedCost.approvalStatus}`);

  // 3. Reverse (Delete) Cost
  console.log("\n--- Step 3: Delete (Reverse) Cost ---");
  await CostService.delete(cost.id, { userId: "65e9cf9f-f6d6-4a9b-b42c-fbbeffcb65d8" });
  const deletedCost = await prisma.costRecord.findUnique({ where: { id: cost.id } });
  console.log(`✅ Cost soft-deleted, WorkflowStatus: ${deletedCost?.workflowStatus}, DeletedAt: ${deletedCost?.deletedAt}`);

  // Verify Reversal Journal
  const revJournal = await prisma.journalEntry.findFirst({ where: { sourceId: cost.id, reference: { startsWith: 'REV-' } } });
  if (revJournal) {
     console.log(`✅ Verified: Reversal journal created successfully (${revJournal.id})`);
  } else {
     console.error(`❌ FAILED: No reversal journal found for soft-deleted cost! (If it wasn't posted, this might be expected. But if it was posted, it's a bug)`);
  }

  console.log("\nE2E Flow Test Complete.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
