import { prisma } from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant';

async function verifyTenantIsolation() {
  console.log("--- STARTING TENANT ISOLATION VERIFICATION ---");

  const COMPANY_A = "COMPANY_A_" + Date.now();
  const COMPANY_B = "COMPANY_B_" + Date.now();

  // 1. Create data for Company A
  let projectAId: string = "";
  await runWithTenant(COMPANY_A, async () => {
    const p = await prisma.project.create({ data: { name: "Project A" } as any });
    projectAId = p.id;
    console.log(`Created Project A: ${p.id} under ${COMPANY_A}`);
  });

  // 2. Attempt to access Project A from Company B context (Should be HIDDEN)
  await runWithTenant(COMPANY_B, async () => {
    const p = await prisma.project.findUnique({ where: { id: projectAId } });
    if (!p) {
      console.log("SUCCESS: Project A is hidden from Company B.");
    } else {
      console.error("FAIL: Project A is visible to Company B!");
    }

    // Try to count
    const count = await prisma.project.count({ where: { id: projectAId } });
    if (count === 0) {
      console.log("SUCCESS: Count is 0 for foreign project.");
    } else {
      console.error("FAIL: Count found foreign project!");
    }
  });

  // 3. Attempt to cross-update (Should fail with isolation error)
  await runWithTenant(COMPANY_B, async () => {
    try {
      // findUnique with result check
      await prisma.project.update({
        where: { id: projectAId },
        data: { name: "Hacked" }
      });
      console.error("FAIL: Cross-tenant update allowed!");
    } catch (e: any) {
      console.log(`SUCCESS: Cross-tenant update blocked: ${e.message}`);
    }
  });

  console.log("--- TENANT ISOLATION VERIFICATION COMPLETED ---");
}

verifyTenantIsolation().catch(console.error).finally(() => prisma.$disconnect());
