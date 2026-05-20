import { CostService } from "../services/cost.service";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("Starting Idempotency Test...");
  const requestId = "test-idempotency-" + Date.now();
  const project = await prisma.project.findFirst({ where: { deletedAt: null } });
  if (!project) {
    console.error("❌ Pre-requisite error: No projects in database.");
    return;
  }
  const wbs = await prisma.wBSItem.findFirst({ where: { projectId: project.id, deletedAt: null } });

  if (!wbs) {
    console.error(`❌ Pre-requisite error: No WBS items found for project ${project.id} in database.`);
    return;
  }

  const costData = {
    projectId: project.id,
    wbsId: wbs.id,
    costType: "material" as any,
    amount: 100000,
    requestId,
    note: "Test idempotency"
  };

  console.log("Sending concurrent requests...");
  const results = await Promise.allSettled([
    CostService.create(costData as any),
    CostService.create(costData as any)
  ]);

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`Request ${i + 1}: Success (ID: ${r.value.id})`);
    } else {
      console.error(`Request ${i + 1}: Failed (${r.reason.message})`);
    }
  });

  const costCount = await prisma.costRecord.count({ where: { requestId } });
  console.log(`Total CostRecords created with requestId ${requestId}: ${costCount}`);

  if (costCount === 1) {
    console.log("✅ Idempotency test PASSED.");
  } else {
    console.error("❌ Idempotency test FAILED.");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
