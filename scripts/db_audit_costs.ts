import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const p = await prisma.project.findFirst({ 
    where: { name: { contains: 'Vinhomes Ocean' } }
  });
  const costs = await prisma.costRecord.findMany({ where: { projectId: p!.id }});
  
  const total = costs.reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = costs.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0);
  
  console.log({ total, paidTotal, count: costs.length });
  console.log(costs.map(c => ({ amount: c.amount, status: c.status, approvalStatus: c.approvalStatus, wflow: c.workflowStatus })));
}
run();
