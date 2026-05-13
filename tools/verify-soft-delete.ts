import { prisma } from '@/lib/prisma';
import { ProjectService } from '@/services/project.service';

async function verifySoftDelete() {
  console.log("--- STARTING SOFT DELETE HARDENING VERIFICATION ---");

  // 1. Setup Project + Cost
  const p = await prisma.project.create({ data: { name: "Soft Delete Test" } });
  const c = await prisma.costRecord.create({ data: { projectId: p.id, amount: 500, costType: 'material' as any } });
  
  console.log(`Setup complete. Project: ${p.id}, Cost: ${c.id}`);

  // 2. Soft Delete Project via Service (should cascade)
  console.log("Deleting project via service...");
  await ProjectService.delete(p.id, "test-user");

  // 3. Verify Project is hidden from standard find
  const pFound = await prisma.project.findUnique({ where: { id: p.id } });
  if (!pFound) {
    console.log("SUCCESS: Project hidden from findUnique.");
  } else {
    console.error("FAIL: Project still visible!");
  }

  // 4. Verify Cost is hidden (Cascade check)
  const cFound = await prisma.costRecord.findUnique({ where: { id: c.id } });
  if (!cFound) {
    console.log("SUCCESS: Cost hidden via cascade.");
  } else {
    console.error("FAIL: Cost still visible!");
  }

  // 5. Verify aggregate excludes deleted
  const agg = await prisma.costRecord.aggregate({
    _sum: { amount: true },
    where: { projectId: p.id }
  });
  console.log(`Aggregate sum: ${agg._sum.amount || 0}`);
  if ((agg._sum.amount || 0) === 0) {
    console.log("SUCCESS: Aggregate correctly excludes deleted records.");
  } else {
    console.error("FAIL: Aggregate included deleted records!");
  }

  console.log("--- SOFT DELETE VERIFICATION COMPLETED ---");
}

verifySoftDelete().catch(console.error).finally(() => prisma.$disconnect());
