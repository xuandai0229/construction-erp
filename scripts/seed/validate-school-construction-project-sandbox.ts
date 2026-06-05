import { PrismaClient, TransactionType } from "../../generated/prisma-client";

const prisma = new PrismaClient();

type Check = { name: string; pass: boolean; detail: string };

function ok(name: string, pass: boolean, detail: string): Check {
  return { name, pass, detail };
}

async function main() {
  const checks: Check[] = [];
  const project = await prisma.project.findFirst({
    where: {
      description: { contains: "SCHOOL_PROJECT_TEST_DATA" },
      name: { contains: "Trường Tiểu học Minh Khai" },
      deletedAt: null,
    },
  });

  checks.push(ok("Có đúng 1 project seed CT-TH-2026", await prisma.project.count({ where: { description: { contains: "CT-TH-2026" }, deletedAt: null } }) === 1, project?.id ?? "missing"));
  checks.push(ok("Có company", !!project?.companyId, project?.companyId ?? "missing"));
  checks.push(ok("Có ít nhất 6 NCC", await prisma.supplier.count({ where: { description: { contains: "SCHOOL_PROJECT_TEST_DATA" }, deletedAt: null } }) >= 6, "supplier marker count"));

  if (!project) {
    console.table(checks);
    throw new Error("E. SEED_VALIDATION_FAILED");
  }

  checks.push(ok("Có contract chính", await prisma.contract.count({ where: { projectId: project.id, contractNumber: "HD-THMK-2026-001", deletedAt: null } }) === 1, "HD-THMK-2026-001"));
  checks.push(ok("Có WBS nhiều cấp", await prisma.wBSItem.count({ where: { projectId: project.id, deletedAt: null } }) >= 18, ">=18 WBS"));
  checks.push(ok("Có budget > 0", Number((await prisma.budgetRecord.aggregate({ where: { projectId: project.id, deletedAt: null }, _sum: { estimatedAmount: true } }))._sum.estimatedAmount ?? 0) > 0, "budget sum"));
  checks.push(ok("Có cost posted/pending/draft", await prisma.costRecord.count({ where: { projectId: project.id, approvalStatus: "APPROVED", workflowStatus: "POSTED", deletedAt: null } }) >= 4 && await prisma.costRecord.count({ where: { projectId: project.id, approvalStatus: "PENDING", deletedAt: null } }) >= 1 && await prisma.costRecord.count({ where: { projectId: project.id, approvalStatus: "DRAFT", deletedAt: null } }) >= 1, "cost statuses"));
  checks.push(ok("Có advance/settlement", await prisma.advanceRequest.count({ where: { projectId: project.id, deletedAt: null } }) >= 3 && await prisma.advanceSettlement.count({ where: { advanceRequest: { projectId: project.id }, deletedAt: null } }) >= 2, "advance and settlement"));
  checks.push(ok("Có invoice/payment", await prisma.invoice.count({ where: { projectId: project.id, deletedAt: null } }) >= 2 && await prisma.payment.count({ where: { projectId: project.id, deletedAt: null } }) >= 1, "invoice/payment"));

  const invoiceAgg = await prisma.invoice.aggregate({ where: { projectId: project.id, approvalStatus: "APPROVED", deletedAt: null }, _sum: { remainingAmount: true } });
  const costAgg = await prisma.costRecord.aggregate({ where: { projectId: project.id, approvalStatus: "APPROVED", deletedAt: null }, _sum: { amount: true } });
  const advanceAgg = await prisma.advanceRequest.aggregate({ where: { projectId: project.id, deletedAt: null }, _sum: { remainingAmount: true } });
  checks.push(ok("Có AR/AP debt và tạm ứng còn lại", Number(invoiceAgg._sum.remainingAmount ?? 0) > 0 && Number(costAgg._sum.amount ?? 0) > 0 && Number(advanceAgg._sum.remainingAmount ?? 0) > 0, "AR/AP/advance > 0"));

  const entries = await prisma.journalEntry.findMany({ where: { projectId: project.id, deletedAt: null }, include: { lines: true } });
  const unbalanced = entries.filter((entry) => {
    const debit = entry.lines.filter((line) => line.type === TransactionType.DEBIT).reduce((sum, line) => sum + Number(line.amount), 0);
    const credit = entry.lines.filter((line) => line.type === TransactionType.CREDIT).reduce((sum, line) => sum + Number(line.amount), 0);
    return Math.abs(debit - credit) > 0.01;
  });
  checks.push(ok("Có JournalEntry balanced", entries.length > 0 && unbalanced.length === 0, `${entries.length} entries, ${unbalanced.length} unbalanced`));
  checks.push(ok("Có TransactionLine", await prisma.transactionLine.count({ where: { journalEntry: { projectId: project.id, deletedAt: null }, deletedAt: null } }) > 0, "ledger lines"));
  checks.push(ok("Có AuditLog seed", await prisma.auditLog.count({ where: { reason: { contains: "SCHOOL_PROJECT_TEST_DATA" } } }) > 0, "audit marker"));
  checks.push(ok("Dashboard/report có dữ liệu", await prisma.financialSnapshot.count({ where: { projectId: project.id } }) > 0 && await prisma.revenue.count({ where: { projectId: project.id, deletedAt: null } }) > 0, "snapshot/revenue"));

  console.table(checks);
  if (checks.some((check) => !check.pass)) {
    throw new Error("E. SEED_VALIDATION_FAILED");
  }
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
