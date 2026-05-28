/**
 * Phase 1 read-only database validation.
 *
 * This script is intentionally non-mutating. It verifies core accounting
 * integrity without deleting, seeding, or rewriting business data.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../generated/prisma-client";

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), name);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

loadEnvFiles();

const prisma = new PrismaClient();

async function main() {
  const [
    users,
    companies,
    projects,
    wbs,
    costs,
    invoices,
    payments,
    revenues,
    contracts,
    journals,
    lines,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.wBSItem.count({ where: { deletedAt: null } }),
    prisma.costRecord.count({ where: { deletedAt: null } }),
    prisma.invoice.count({ where: { deletedAt: null } }),
    prisma.payment.count({ where: { deletedAt: null } }),
    prisma.revenue.count({ where: { deletedAt: null } }),
    prisma.contract.count({ where: { deletedAt: null } }),
    prisma.journalEntry.count({ where: { deletedAt: null } }),
    prisma.transactionLine.count({ where: { deletedAt: null } }),
  ]);

  const journalRows = await prisma.journalEntry.findMany({
    where: { deletedAt: null, isPosted: true, isReversed: false },
    include: { lines: { where: { deletedAt: null } } },
    take: 5000,
  });
  const unbalanced = journalRows.filter((entry) => {
    const debit = entry.lines.filter((line) => line.type === "DEBIT").reduce((sum, line) => sum + Number(line.amount), 0);
    const credit = entry.lines.filter((line) => line.type === "CREDIT").reduce((sum, line) => sum + Number(line.amount), 0);
    return Math.abs(debit - credit) > 0.01;
  });

  const orphanCostWbs = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "CostRecord" c
    LEFT JOIN "WBSItem" w ON w.id = c."wbsId" AND w."deletedAt" IS NULL
    WHERE c."deletedAt" IS NULL AND w.id IS NULL
  `;

  const orphanInvoiceWbs = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "Invoice" i
    LEFT JOIN "WBSItem" w ON w.id = i."wbsId" AND w."deletedAt" IS NULL
    WHERE i."deletedAt" IS NULL AND w.id IS NULL
  `;

  const postedPaymentIds = (
    await prisma.journalEntry.findMany({
      where: { sourceType: "PAYMENT", deletedAt: null, isPosted: true, isReversed: false },
      select: { sourceId: true },
    })
  )
    .map((entry) => entry.sourceId)
    .filter((id): id is string => Boolean(id));

  const draftPostedPayments = postedPaymentIds.length
    ? await prisma.payment.count({
        where: {
          id: { in: postedPaymentIds },
          deletedAt: null,
          approvalStatus: "DRAFT",
        },
      })
    : 0;

  const result = {
    mode: "read-only",
    counts: { users, companies, projects, wbs, costs, invoices, payments, revenues, contracts, journalEntries: journals, transactionLines: lines },
    integrity: {
      sampledPostedJournalEntries: journalRows.length,
      unbalancedPostedJournalEntries: unbalanced.length,
      orphanCostWbs: orphanCostWbs[0]?.count ?? 0,
      orphanInvoiceWbs: orphanInvoiceWbs[0]?.count ?? 0,
      draftPostedPayments,
    },
  };

  const outputDir = path.join(process.cwd(), "docs", "audit");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "phase1-readonly-validation.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  const failed =
    result.integrity.unbalancedPostedJournalEntries > 0 ||
    result.integrity.orphanCostWbs > 0 ||
    result.integrity.orphanInvoiceWbs > 0 ||
    result.integrity.draftPostedPayments > 0;
  if (failed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
