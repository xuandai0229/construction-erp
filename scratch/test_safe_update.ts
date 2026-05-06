import { CostService } from "@/services/cost.service";
import { prisma } from "@/lib/prisma";

async function testSafeAmountUpdate() {
  console.log("Starting Safe Amount Update Test...");

  try {
    const project = await prisma.project.findFirst() || await prisma.project.create({ data: { name: "Safe Update Project" } });
    const wbs = await prisma.wBSItem.findFirst({ where: { projectId: project.id } }) || await prisma.wBSItem.create({ data: { projectId: project.id, name: "Safe Update WBS" } });

    // 1. Create a Cost of 100k
    console.log("Step 1: Creating a Cost of 100k...");
    const cost = await CostService.create({
      projectId: project.id,
      wbsId: wbs.id,
      amount: 100000,
      costType: "material",
      note: "Initial Cost",
      date: new Date().toISOString(),
      status: "unpaid"
    });

    async function checkLedgerStatus(sourceId: string) {
      const lines = await prisma.transactionLine.findMany({
        where: { journalEntry: { sourceId: sourceId } },
        include: { journalEntry: true }
      });
      const debits = lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
      const credits = lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
      const entryCount = new Set(lines.map(l => l.journalEntryId)).size;
      console.log(`Source ${sourceId}: Entries=${entryCount}, Total Debit=${debits}, Total Credit=${credits}, Net=${debits - credits}`);
      return { debits, credits, entryCount };
    }

    await checkLedgerStatus(cost.id);

    // 2. Update Cost to 250k
    console.log("Step 2: Updating Cost from 100k to 250k...");
    await CostService.update(cost.id, {
      amount: 250000,
      note: "Updated Cost to 250k"
    });

    // 3. Final Verification
    console.log("Step 3: Final Verification...");
    const status = await checkLedgerStatus(cost.id);

    // Expected: 1 original (100) + 1 reversal (100) + 1 new (250) = 3 entries
    if (status.entryCount === 3) {
      console.log("✅ SUCCESS: 3 journal entries found (Original + Reversal + New).");
    } else {
      console.error(`❌ FAILED: Expected 3 entries, found ${status.entryCount}`);
    }

    if (status.debits === status.credits && status.debits === (100000 + 100000 + 250000)) {
      console.log("✅ SUCCESS: Ledger is balanced and total gross flow is correct.");
    }

    const netImpact = await prisma.transactionLine.aggregate({
      where: { 
        journalEntry: { sourceId: cost.id },
        type: "DEBIT" // Just check debits to see net expense
      },
      _sum: { amount: true }
    });
    // This is tricky because we have a reversal debit. 
    // Net Debit = Original Debit (100) - Reversal Credit (100) + New Debit (250) ? 
    // No, Reversal swaps the side. 
    // So Net Debit = Debit(Original) + Debit(New) = 100 + 250 = 350? 
    // Wait, let's look at the accounts.
    
    const expenseLines = await prisma.transactionLine.findMany({
      where: { 
        journalEntry: { sourceId: cost.id },
        account: { code: "6210" } // Expense account
      }
    });
    const netExpense = expenseLines.reduce((s, l) => s + (l.type === "DEBIT" ? Number(l.amount) : -Number(l.amount)), 0);
    console.log(`Net Expense Impact on account 6210: ${netExpense}`);

    if (netExpense === 250000) {
      console.log("✅ SUCCESS: Net financial impact is exactly 250k.");
    } else {
      console.error(`❌ FAILED: Net impact is ${netExpense}`);
    }

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

testSafeAmountUpdate().catch(console.error);
