import { prisma } from "../lib/prisma";
import { PostingEngine } from "../lib/accounting/postingEngine";

async function run() {
  console.log("Starting Transaction Safety (Rollback) Test...");
  const requestId = "test-rollback-" + Date.now();
  
  const project = await prisma.project.findFirst({ where: { deletedAt: null } });
  const wbs = await prisma.wBSItem.findFirst({ where: { deletedAt: null } });

  if (!project || !wbs) {
    console.error("❌ Pre-requisite error: No projects or WBS items in database to run rollback test.");
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create a cost record
      const cost = await tx.costRecord.create({
        data: {
          projectId: project.id,
          wbsId: wbs.id,
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
