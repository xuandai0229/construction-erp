const { PrismaClient } = require('../generated/prisma-client');
const p = new PrismaClient();

async function main() {
  const logs = await p.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(logs);
}
main().finally(() => p.$disconnect());
