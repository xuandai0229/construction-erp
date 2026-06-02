import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";
import { getArApLedgerReconciliation } from "../../lib/accounting/financialTrace";

const PROJECT_ID = "project-battrang";
const AP_CODES = ["3310", "3311", "331", "3318"];

function money(value: unknown) {
  return Number(value || 0).toLocaleString("vi-VN");
}

async function main() {
  const project = await prisma.project.findUnique({ where: { id: PROJECT_ID }, select: { id: true, name: true, companyId: true } });
  if (!project) throw new Error(`Không tìm thấy công trình ${PROJECT_ID}`);

  const [reconciliation, journals, costs, invoices, payments, advances, settlements, contracts] = await Promise.all([
    getArApLedgerReconciliation(PROJECT_ID),
    prisma.journalEntry.findMany({
      where: { projectId: PROJECT_ID, deletedAt: null, isPosted: true },
      include: { lines: { include: { account: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.costRecord.findMany({ where: { projectId: PROJECT_ID, deletedAt: null }, orderBy: { date: "asc" } }),
    prisma.invoice.findMany({ where: { projectId: PROJECT_ID, deletedAt: null }, orderBy: { issuedDate: "asc" } }),
    prisma.payment.findMany({ where: { projectId: PROJECT_ID, deletedAt: null }, orderBy: { date: "asc" } }),
    prisma.advanceRequest.findMany({ where: { projectId: PROJECT_ID, deletedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.advanceSettlement.findMany({
      where: { advanceRequest: { projectId: PROJECT_ID }, deletedAt: null },
      orderBy: { settlementDate: "asc" },
    }),
    prisma.contract.findMany({ where: { projectId: PROJECT_ID, deletedAt: null }, include: { supplier: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const apLines = journals.flatMap(journal => journal.lines
    .filter(line => AP_CODES.some(code => line.account.code.startsWith(code)))
    .map(line => ({
      journalEntryId: journal.id,
      date: journal.date,
      sourceType: journal.sourceType,
      sourceId: journal.sourceId,
      reference: journal.reference,
      description: journal.description,
      isReversed: journal.isReversed,
      accountCode: line.account.code,
      accountName: line.account.name,
      type: line.type,
      amount: Number(line.amount),
      signedAmount: line.type === "CREDIT" ? -Number(line.amount) : Number(line.amount),
    })));

  const apLedger = apLines.reduce((sum, line) => sum + line.signedAmount, 0);
  const reversedAp = apLines.filter(line => line.isReversed).reduce((sum, line) => sum + line.signedAmount, 0);
  const apBySource = apLines.reduce<Record<string, number>>((acc, line) => {
    const key = `${line.sourceType || "NO_SOURCE"}:${line.sourceId || "NO_ID"}`;
    acc[key] = (acc[key] || 0) + line.signedAmount;
    return acc;
  }, {});

  const topApSources = Object.entries(apBySource)
    .map(([source, amount]) => ({ source, amount }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  fs.mkdirSync(path.join(process.cwd(), "docs", "audit"), { recursive: true });
  const reportPath = path.join(process.cwd(), "docs", "audit", "FORENSIC_AP_PROJECT_BATTRANG.md");
  const report = `# FORENSIC AP PROJECT BATTRANG

Ngày tạo: ${new Date().toISOString()}

## 1. Project

- Project ID: \`${project.id}\`
- Tên công trình: ${project.name}
- Company ID: \`${project.companyId || "NULL"}\`

## 2. Reconciliation Summary

| Chỉ tiêu | Số tiền |
| --- | ---: |
| Ledger AP theo reconciliation | ${money(reconciliation.ap.ledger)} |
| Operational AP theo reconciliation | ${money(reconciliation.ap.operational)} |
| Variance | ${money(reconciliation.ap.variance)} |
| AP tính lại từ TransactionLine trong forensic | ${money(apLedger)} |
| AP thuộc journal reversed | ${money(reversedAp)} |

## 3. AP Transaction Lines

| Journal | Ngày | Source | TK | Nợ/Có | Số tiền | Signed | Reversed | Diễn giải |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- |
${apLines.map(line => `| ${line.journalEntryId} | ${line.date.toISOString().slice(0, 10)} | ${line.sourceType || ""}:${line.sourceId || ""} | ${line.accountCode} | ${line.type} | ${money(line.amount)} | ${money(line.signedAmount)} | ${line.isReversed ? "Có" : "Không"} | ${(line.description || "").replace(/\|/g, "/")} |`).join("\n")}

## 4. Top AP Sources

| Source | Signed amount |
| --- | ---: |
${topApSources.map(item => `| ${item.source} | ${money(item.amount)} |`).join("\n")}

## 5. Operational Records

| Nhóm | Số lượng | Tổng tiền chính |
| --- | ---: | ---: |
| CostRecord | ${costs.length} | ${money(costs.reduce((sum, item) => sum + Number(item.amount || 0), 0))} |
| Invoice | ${invoices.length} | ${money(invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0))} |
| Payment | ${payments.length} | ${money(payments.reduce((sum, item) => sum + Number(item.amount || 0), 0))} |
| AdvanceRequest | ${advances.length} | ${money(advances.reduce((sum, item) => sum + Number(item.amount || 0), 0))} |
| AdvanceSettlement | ${settlements.length} | ${money(settlements.reduce((sum, item) => sum + Number(item.amount || 0), 0))} |
| Contract | ${contracts.length} | ${money(contracts.reduce((sum, item) => sum + Number(item.currentValue || 0), 0))} |

## 6. Kết luận forensic

- Ledger AP có phát sinh ${money(apLedger)} từ các TransactionLine tài khoản ${AP_CODES.join(", ")}.
- Operational AP trong reconciliation hiện bằng ${money(reconciliation.ap.operational)}, nên số lệch chủ yếu đến từ việc ledger có AP nhưng operational payable chưa mapping/cộng cùng nguồn.
- Không tự tạo bút toán điều chỉnh trong Phase 2.5 vì chưa có bằng chứng ledger sai. Cần kế toán đối soát nguồn ${topApSources[0]?.source || "không xác định"} và mapping operational payable của công trình.
- Nếu ledger là đúng, cần backfill/mapping operational payable hoặc sửa query reconciliation. Nếu operational là đúng, cần review journal AP liên quan trước khi lập bút toán đảo/điều chỉnh.
`;

  fs.writeFileSync(reportPath, report, "utf8");
  console.log(JSON.stringify({
    status: reconciliation.ap.variance ? "WARNING" : "PASS",
    reportPath,
    projectId: PROJECT_ID,
    apLedger,
    operationalAp: reconciliation.ap.operational,
    variance: reconciliation.ap.variance,
    topApSources,
  }, null, 2));
}

main().catch(error => {
  console.error("FAIL forensic-ap-project-battrang");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
