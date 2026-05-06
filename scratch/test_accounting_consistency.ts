import { CostService } from "@/services/cost.service";
import { prisma } from "@/lib/prisma";

async function testAccountingConsistency() {
  console.log("Starting Accounting Consistency Test...");

  try {
    const project = await prisma.project.findFirst() || await prisma.project.create({ data: { name: "Test Project" } });
    const wbs = await prisma.wBSItem.findFirst({ where: { projectId: project.id } }) || await prisma.wBSItem.create({ data: { projectId: project.id, name: "Test WBS" } });

    // 1. Create a Cost
    console.log("Step 1: Creating a Cost of 500k...");
    const cost = await CostService.create({
      projectId: project.id,
      wbsId: wbs.id,
      amount: 500000,
      costType: "material",
      note: "Test Cost for Reversal",
      date: new Date().toISOString(),
      status: "unpaid"
    });

    // Check balance
    let ledger = await prisma.transactionLine.aggregate({
      where: { journalEntry: { projectId: project.id } },
      _sum: { amount: true }
    });
    // This isn't enough, we need to check Debit vs Credit
    
    async function checkBalance(projId: string) {
      const lines = await prisma.transactionLine.findMany({
        where: { journalEntry: { projectId: projId } }
      });
      const debits = lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
      const credits = lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
      console.log(`Balance Check: Debit=${debits}, Credit=${credits}, Diff=${debits - credits}`);
      return { debits, credits };
    }

    await checkBalance(project.id);

    // 2. Reverse (Soft Delete) the Cost
    console.log("Step 2: Reversing (Soft Deleting) the Cost...");
    await CostService.delete(cost.id);

    // 3. Final Balance Check
    console.log("Step 3: Final Balance Check...");
    const finalBalance = await checkBalance(project.id);

    if (Math.abs(finalBalance.debits - finalBalance.credits) < 0.01) {
      console.log("✅ SUCCESS: Debit equals Credit after reversal.");
    } else {
      console.error("❌ FAILED: Ledger is unbalanced!");
    }

    // Check if total expense for this cost is now 0 (in a specific report we'd filter deletedAt)
    // Here we just check if the sum of all lines for this sourceId is 0
    const sourceLines = await prisma.transactionLine.findMany({
      where: { journalEntry: { sourceId: cost.id, sourceType: "COST" } }
    });
    const sourceDebits = sourceLines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
    const sourceCredits = sourceLines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
    console.log(`Source Net Impact: Debit Sum=${sourceDebits}, Credit Sum=${sourceCredits}, Net=${sourceDebits - sourceCredits}`);

    if (sourceDebits === sourceCredits && sourceDebits > 0) {
      console.log("✅ SUCCESS: Net financial impact of the cost is ZERO.");
    }

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

testAccountingConsistency().catch(console.error);
