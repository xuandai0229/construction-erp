const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({take:1});
  const projectId = projects[0].id;
  
  const budgets = await prisma.budgetRecord.findMany({where: {projectId: projectId}});
  const logs = await prisma.auditLog.findMany({orderBy:{timestamp:'desc'}, take: 5});
  
  console.log('--- DB STATE ---');
  console.log('PROJECT ID:', projectId);
  console.log('PROJECT TOTAL BUDGET:', projects[0].totalBudget);
  console.log('BUDGETS COUNT:', budgets.length);
  console.log('LAST 5 AUDIT LOGS:', logs.map(l => ({ action: l.action, recordId: l.recordId })));
}

main().finally(()=>prisma.$disconnect());
