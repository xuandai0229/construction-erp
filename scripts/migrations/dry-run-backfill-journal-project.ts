import { buildJournalProjectPlan, prisma, writeAuditJson } from "./phase25-backfill-utils";

async function main() {
  const plan = await buildJournalProjectPlan();
  const result = {
    mode: "dry-run",
    generatedAt: new Date().toISOString(),
    summary: {
      total: plan.length,
      high: plan.filter(item => item.confidence === "HIGH").length,
      manualReview: plan.filter(item => item.confidence === "MANUAL_REVIEW").length,
    },
    plan,
    rollbackNote: "Dry-run không thay đổi dữ liệu. Apply script chỉ cập nhật record HIGH và có thể rollback bằng oldData trong audit log phase25-journal-project-backfill.json.",
  };
  writeAuditJson("phase25-journal-project-backfill-dry-run.json", result);
  console.table(plan);
  console.log(JSON.stringify(result.summary, null, 2));
}

main().catch(error => {
  console.error("FAIL dry-run-backfill-journal-project");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
