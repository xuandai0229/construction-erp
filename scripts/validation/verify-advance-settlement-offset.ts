import { prisma } from "../../lib/prisma";

async function main() {
  const [advancesMissingProject, advancesMissingRecipient, advancesMissingPurpose, paidAdvancesMissingJournal, settlementAgg] = await Promise.all([
    prisma.advanceRequest.count({ where: { deletedAt: null, projectId: null } }),
    prisma.advanceRequest.count({ where: { deletedAt: null, supplierId: null, employeeId: null } }),
    prisma.advanceRequest.count({ where: { deletedAt: null, OR: [{ purpose: null }, { purpose: "" }] } }),
    prisma.advanceRequest.count({ where: { deletedAt: null, status: { in: ["PAID", "PARTIALLY_SETTLED", "FULLY_SETTLED"] }, postedJournalEntryId: null } }),
    prisma.advanceSettlement.groupBy({
      by: ["advanceRequestId"],
      where: { deletedAt: null, status: { in: ["APPROVED", "POSTED"] } },
      _sum: { amount: true }
    })
  ]);

  const advanceIds = settlementAgg.map(item => item.advanceRequestId);
  const advances = advanceIds.length
    ? await prisma.advanceRequest.findMany({ where: { id: { in: advanceIds } }, select: { id: true, paidAmount: true, amount: true } })
    : [];
  const advanceMap = new Map(advances.map(item => [item.id, item]));
  const overSettlements = settlementAgg
    .filter(item => Number(item._sum.amount || 0) > Number(advanceMap.get(item.advanceRequestId)?.paidAmount || advanceMap.get(item.advanceRequestId)?.amount || 0) + 0.01)
    .map(item => ({ advanceRequestId: item.advanceRequestId, settledAmount: Number(item._sum.amount || 0) }));

  const issues = [
    advancesMissingProject && `${advancesMissingProject} tạm ứng thiếu projectId.`,
    advancesMissingRecipient && `${advancesMissingRecipient} tạm ứng thiếu người/NCC nhận.`,
    advancesMissingPurpose && `${advancesMissingPurpose} tạm ứng thiếu mục đích.`,
    paidAdvancesMissingJournal && `${paidAdvancesMissingJournal} tạm ứng đã chi nhưng thiếu postedJournalEntryId.`,
    overSettlements.length && `${overSettlements.length} tạm ứng có hoàn ứng/đối trừ vượt số đã chi.`
  ].filter(Boolean);

  console.log(JSON.stringify({
    status: issues.length ? "WARNING" : "PASS",
    issues,
    overSettlements,
    counts: { advancesMissingProject, advancesMissingRecipient, advancesMissingPurpose, paidAdvancesMissingJournal }
  }, null, 2));
}

main()
  .catch(error => {
    console.error("FAIL verify-advance-settlement-offset");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
