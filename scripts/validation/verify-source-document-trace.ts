import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";

async function main() {
  const root = process.cwd();
  const requiredRoutes = [
    "app/api/trace/source-document/route.ts",
    "app/api/trace/project-financial/route.ts",
    "app/api/trace/contract-financial/route.ts",
    "app/api/trace/supplier-financial/route.ts",
    "app/api/trace/wbs-financial/route.ts"
  ];
  const missingRoutes = requiredRoutes.filter(file => !fs.existsSync(path.join(root, file)));

  const [journalsMissingSource, journalsMissingProject, postedCostsMissingLedger, approvedInvoicesMissingLedger, approvedPaymentsMissingLedger] = await Promise.all([
    prisma.journalEntry.count({ where: { deletedAt: null, isPosted: true, isReversed: false, OR: [{ sourceType: null }, { sourceId: null }] } }),
    prisma.journalEntry.count({ where: { deletedAt: null, isPosted: true, isReversed: false, projectId: null } }),
    prisma.costRecord.count({
      where: {
        deletedAt: null,
        approvalStatus: "APPROVED",
        NOT: { id: { in: await prisma.journalEntry.findMany({ where: { sourceType: "COST", deletedAt: null, isReversed: false }, select: { sourceId: true } }).then(rows => rows.map(row => row.sourceId || "")) } }
      }
    }),
    prisma.invoice.count({
      where: {
        deletedAt: null,
        approvalStatus: "APPROVED",
        NOT: { id: { in: await prisma.journalEntry.findMany({ where: { sourceType: "INVOICE", deletedAt: null, isReversed: false }, select: { sourceId: true } }).then(rows => rows.map(row => row.sourceId || "")) } }
      }
    }),
    prisma.payment.count({
      where: {
        deletedAt: null,
        approvalStatus: "APPROVED",
        NOT: { id: { in: await prisma.journalEntry.findMany({ where: { sourceType: "PAYMENT", deletedAt: null, isReversed: false }, select: { sourceId: true } }).then(rows => rows.map(row => row.sourceId || "")) } }
      }
    })
  ]);

  const issues = [
    ...missingRoutes.map(route => `Thiếu route trace: ${route}`),
    journalsMissingSource && `${journalsMissingSource} journal posted thiếu sourceType/sourceId.`,
    journalsMissingProject && `${journalsMissingProject} journal posted thiếu projectId.`,
    postedCostsMissingLedger && `${postedCostsMissingLedger} cost APPROVED chưa có ledger active.`,
    approvedInvoicesMissingLedger && `${approvedInvoicesMissingLedger} invoice APPROVED chưa có ledger active.`,
    approvedPaymentsMissingLedger && `${approvedPaymentsMissingLedger} payment APPROVED chưa có ledger active.`
  ].filter(Boolean);

  console.log(JSON.stringify({
    status: missingRoutes.length || journalsMissingSource ? "FAIL" : issues.length ? "WARNING" : "PASS",
    issues,
    counts: { journalsMissingSource, journalsMissingProject, postedCostsMissingLedger, approvedInvoicesMissingLedger, approvedPaymentsMissingLedger }
  }, null, 2));
  if (missingRoutes.length || journalsMissingSource) process.exit(1);
}

main()
  .catch(error => {
    console.error("FAIL verify-source-document-trace");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
