const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.auditLog.findMany({
     where: { entity: 'BudgetRecord' },
     orderBy: { timestamp:'desc' }, 
     take: 10
  }); 
  console.log(logs.map(l => ({ action: l.action, entityId: l.entityId, time: l.timestamp })));
}
main().finally(()=>prisma.$disconnect());
