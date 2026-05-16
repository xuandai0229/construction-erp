
import { prisma } from "../lib/prisma";

async function checkStatus() {
  const projectId = "90ae6c5b-22d1-408b-837e-a1306999143b";
  const costs = await prisma.costRecord.findMany({
    where: { projectId, deletedAt: null }
  });

  console.log(`COSTS FOR PROJECT ${projectId}:`);
  console.log(costs.map(c => ({
    id: c.id,
    amount: c.amount,
    approvalStatus: c.approvalStatus,
    workflowStatus: c.workflowStatus
  })));
}

checkStatus().catch(console.error);
