import { buildProjectCompanyPlan, prisma, writeAuditJson } from "./phase25-backfill-utils";

async function main() {
  const plan = await buildProjectCompanyPlan();
  const candidates = plan.filter(item => item.confidence === "HIGH" && item.inferredCompanyId);
  const updates: Array<Record<string, unknown>> = [];

  await prisma.$transaction(async tx => {
    for (const item of candidates) {
      const before = await tx.project.findUnique({ where: { id: item.projectId }, select: { id: true, name: true, companyId: true } });
      if (!before || before.companyId) continue;
      const after = await tx.project.update({
        where: { id: item.projectId },
        data: { companyId: item.inferredCompanyId },
        select: { id: true, name: true, companyId: true },
      });
      await tx.auditLog.create({
        data: {
          action: "DATA_BACKFILL",
          entity: "Project",
          entityId: item.projectId,
          oldData: before,
          newData: after,
          reason: `Phase 2.5 backfill companyId: ${item.reason}`,
          severity: "WARNING",
        },
      });
      updates.push({ plan: item, before, after });
    }
  });

  const result = {
    mode: "apply",
    generatedAt: new Date().toISOString(),
    updated: updates.length,
    skipped: plan.length - updates.length,
    updates,
    manualReview: plan.filter(item => item.confidence !== "HIGH"),
    rollbackNote: "Rollback thủ công: dùng updates[].before.companyId trong file này để set lại Project.companyId; mọi thay đổi đã có AuditLog action DATA_BACKFILL.",
  };
  writeAuditJson("phase25-project-company-backfill.json", result);
  console.log(JSON.stringify({ updated: result.updated, skipped: result.skipped, manualReview: result.manualReview.length }, null, 2));
}

main().catch(error => {
  console.error("FAIL apply-backfill-project-company");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
