
import { prisma } from "../lib/prisma";

async function findApproved() {
  const costs = await prisma.costRecord.findMany({
    where: { 
      deletedAt: null,
      approvalStatus: 'APPROVED'
    },
    take: 5
  });

  console.log("APPROVED COSTS FOUND:");
  console.log(costs.map(c => ({
    id: c.id,
    projectId: c.projectId,
    amount: c.amount,
    approvalStatus: c.approvalStatus,
    workflowStatus: c.workflowStatus
  })));
}

findApproved().catch(console.error);
