import { prisma, inferProjectCompany } from "../migrations/phase25-backfill-utils";

async function main() {
  const projectsWithoutCompany = await prisma.project.findMany({
    where: { deletedAt: null, companyId: null },
    select: { id: true, name: true, branchId: true },
    orderBy: { createdAt: "asc" },
  });

  const invalidCompanyProjects = await prisma.project.findMany({
    where: { deletedAt: null, companyId: { not: null }, company: null },
    select: { id: true, name: true, companyId: true },
  });

  const plans = await Promise.all(projectsWithoutCompany.map(inferProjectCompany));
  const accountingDataWithoutScope = [];
  for (const project of projectsWithoutCompany) {
    const [costs, invoices, payments, advances, journals] = await Promise.all([
      prisma.costRecord.count({ where: { projectId: project.id, deletedAt: null } }),
      prisma.invoice.count({ where: { projectId: project.id, deletedAt: null } }),
      prisma.payment.count({ where: { projectId: project.id, deletedAt: null } }),
      prisma.advanceRequest.count({ where: { projectId: project.id, deletedAt: null } }),
      prisma.journalEntry.count({ where: { projectId: project.id, deletedAt: null } }),
    ]);
    if (costs + invoices + payments + advances + journals > 0) {
      accountingDataWithoutScope.push({ projectId: project.id, name: project.name, costs, invoices, payments, advances, journals });
    }
  }

  console.log(JSON.stringify({
    status: projectsWithoutCompany.length || invalidCompanyProjects.length ? "WARNING" : "PASS",
    counts: {
      projectsWithoutCompany: projectsWithoutCompany.length,
      invalidCompanyProjects: invalidCompanyProjects.length,
      highConfidenceBackfillCandidates: plans.filter(item => item.confidence === "HIGH").length,
      manualReview: plans.filter(item => item.confidence === "MANUAL_REVIEW").length,
      projectsWithAccountingDataWithoutScope: accountingDataWithoutScope.length,
    },
    backfillPlan: plans,
    invalidCompanyProjects,
    accountingDataWithoutScope,
  }, null, 2));
}

main().catch(error => {
  console.error("FAIL verify-project-company-scope");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
