const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({take:1});
  const budgets = await prisma.budgetRecord.findMany({where: {projectId: projects[0].id}});
  
  let expectedSum = 0;
  for(const b of budgets) expectedSum += Number(b.estimatedAmount);
  
  console.log('Project.totalBudget:', Number(projects[0].totalBudget));
  console.log('Sum of BudgetRecords:', expectedSum);
  console.log('Records Count:', budgets.length);
}
main().finally(()=>prisma.$disconnect());
