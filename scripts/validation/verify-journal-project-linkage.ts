import { prisma, inferJournalProject } from "../migrations/phase25-backfill-utils";

async function main() {
  const postedMissingProject = await prisma.journalEntry.findMany({
    where: { deletedAt: null, isPosted: true, projectId: null },
    select: { id: true, sourceType: true, sourceId: true, date: true, isReversed: true },
    orderBy: { date: "asc" },
  });

  const invalidProjectJournals = await prisma.journalEntry.findMany({
    where: { deletedAt: null, isPosted: true, projectId: { not: null }, project: null },
    select: { id: true, projectId: true, sourceType: true, sourceId: true },
  });

  const plans = await Promise.all(postedMissingProject.map(inferJournalProject));
  const reversedPosted = postedMissingProject.filter(item => item.isReversed);
  const affectedLines = await prisma.transactionLine.count({
    where: {
      deletedAt: null,
      journalEntry: { deletedAt: null, isPosted: true, projectId: null },
    },
  });

  console.log(JSON.stringify({
    status: postedMissingProject.length || invalidProjectJournals.length ? "WARNING" : "PASS",
    counts: {
      postedJournalsMissingProject: postedMissingProject.length,
      invalidProjectJournals: invalidProjectJournals.length,
      reversedPostedMissingProject: reversedPosted.length,
      highConfidenceBackfillCandidates: plans.filter(item => item.confidence === "HIGH").length,
      manualReview: plans.filter(item => item.confidence === "MANUAL_REVIEW").length,
      affectedTransactionLines: affectedLines,
    },
    backfillPlan: plans,
    invalidProjectJournals,
  }, null, 2));
}

main().catch(error => {
  console.error("FAIL verify-journal-project-linkage");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
