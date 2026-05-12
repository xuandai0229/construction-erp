import { CostService } from "../services/cost.service";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("Starting Idempotency Test...");
  const requestId = "test-idempotency-" + Date.now();
  const costData = {
    projectId: "2fa9e808-761f-4532-8d0c-85e748aaaeb4",
    wbsId: "73533917-034d-4a2a-ba6d-968b783ba55b",
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
