import { prisma } from "../../lib/prisma";
import { getArApLedgerReconciliation } from "../../lib/accounting/financialTrace";

async function main() {
  const projects = await prisma.project.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, take: 50 });
  const results = [];
  for (const project of projects) {
    const reconciliation = await getArApLedgerReconciliation(project.id);
    const hasVariance = Math.abs(reconciliation.ar.variance) >= 1 || Math.abs(reconciliation.ap.variance) >= 1;
    const hasExceptions = reconciliation.exceptions.unallocatedApprovedPayments.length > 0 || reconciliation.exceptions.settlementOverAdvance.length > 0;
    if (hasVariance || hasExceptions) {
      results.push({ projectId: project.id, projectName: project.name, ...reconciliation });
    }
  }

  console.log(JSON.stringify({
    status: results.length ? "WARNING" : "PASS",
    projectCount: projects.length,
    varianceProjectCount: results.length,
    results
  }, null, 2));
}

main()
  .catch(error => {
    console.error("FAIL verify-ar-ap-ledger-reconciliation");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
