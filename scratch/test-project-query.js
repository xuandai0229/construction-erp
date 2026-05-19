const { PrismaClient } = require('../generated/prisma-client');
const prisma = new PrismaClient();

async function test() {
  console.log("=== RUNTIME COMPATIBILITY TEST ===");
  try {
    // 1. Try querying users
    const users = await prisma.user.findMany();
    console.log(`User query: SUCCESS. Count: ${users.length}`);

    // 2. Try querying projects
    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true, wbsItems: true } }
      }
    });
    console.log(`Project query: SUCCESS. Count: ${projects.length}`);

    // 3. Try querying cost records
    const costs = await prisma.costRecord.findMany();
    console.log(`CostRecord query: SUCCESS. Count: ${costs.length}`);

    // 4. Try querying audit logs
    const auditLogs = await prisma.auditLog.findMany();
    console.log(`AuditLog query: SUCCESS. Count: ${auditLogs.length}`);

    console.log("=== ALL TEST RUNTIME QUERIES COMPLETED WITH 100% SUCCESS ===");
  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
