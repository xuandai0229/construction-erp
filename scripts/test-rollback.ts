import { prisma } from "../lib/prisma";
import { PostingEngine } from "../lib/accounting/postingEngine";

async function run() {
  console.log("Starting Transaction Safety (Rollback) Test...");
  const requestId = "test-rollback-" + Date.now();
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create a cost record
      const cost = await tx.costRecord.create({
        data: {
          projectId: "2fa9e808-761f-4532-8d0c-85e748aaaeb4",
          wbsId: "73533917-034d-4a2a-ba6d-968b783ba55b",
          costType: "material",
          amount: 999999,
          requestId,
          note: "Rollback test"
        }
      });
      console.log(`Step 1: Cost created (ID: ${cost.id})`);

      // 2. Intentionally throw error before posting to ledger
      console.log("Step 2: Throwing intentional error...");
      throw new Error("INTENTIONAL_FAILURE");
    });
  } catch (e: any) {
    if (e.message === "INTENTIONAL_FAILURE") {
      console.log("✅ Expected intentional failure caught.");
    } else {
      console.error("❌ Unexpected error:", e);
    }
  }

  // Verify cost record was NOT created (rolled back)
  const cost = await prisma.costRecord.findUnique({ where: { requestId } });
  if (!cost) {
    console.log("✅ Rollback verified: CostRecord was NOT created.");
  } else {
    console.error("❌ Rollback FAILED: CostRecord exists in DB!");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
