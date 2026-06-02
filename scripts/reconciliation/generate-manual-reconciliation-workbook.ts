import fs from "node:fs";
import path from "node:path";
import { prisma, readJson, reconciliationDir, writeCsv, journalAmounts, ensureDirs } from "./reconciliation-utils";

const projectHeaders = [
  "projectId",
  "projectCode",
  "projectName",
  "currentCompanyId",
  "suggestedCompanyId",
  "evidence",
  "confidence",
  "ownerDecision",
  "approvedCompanyId",
  "decisionReason",
  "approvedBy",
  "approvedAt",
  "action",
];

const journalHeaders = [
  "journalEntryId",
  "journalDate",
  "sourceType",
  "sourceId",
  "description",
  "amountDebit",
  "amountCredit",
  "currentProjectId",
  "suggestedProjectId",
  "cashBankDocumentId",
  "cashBankDocumentNo",
  "counterparty",
  "evidence",
  "ownerDecision",
  "approvedProjectId",
  "nonProjectReason",
  "decisionReason",
  "approvedBy",
  "approvedAt",
  "action",
];

const apHeaders = [
  "sourceType",
  "sourceId",
  "journalEntryId",
  "journalDate",
  "accountCode",
  "debitCredit",
  "amount",
  "signedAmount",
  "isReversed",
  "description",
  "linkedCostId",
  "linkedPaymentId",
  "linkedContractId",
  "linkedSupplierId",
  "operationalRecordExists",
  "operationalAmount",
  "ledgerAmount",
  "variance",
  "ownerDecision",
  "mappingAction",
  "decisionReason",
  "approvedBy",
  "approvedAt",
];

type ProjectPlan = {
  projectId: string;
  projectCode: string;
  projectName: string;
  inferredCompanyId: string | null;
  confidence: string;
  reason: string;
};

type JournalPlan = {
  journalEntryId: string;
  sourceType: string | null;
  sourceId: string | null;
  journalDate: string;
  inferredProjectId: string | null;
  confidence: string;
  reason: string;
};

async function writeProjectMappings() {
  const dryRun = readJson<{ plan: ProjectPlan[] }>("docs/audit/phase25-project-company-backfill-dry-run.json");
  const rows = await Promise.all(dryRun.plan.map(async item => {
    const project = await prisma.project.findUnique({ where: { id: item.projectId }, select: { companyId: true } });
    return {
      projectId: item.projectId,
      projectCode: item.projectCode,
      projectName: item.projectName,
      currentCompanyId: project?.companyId || "",
      suggestedCompanyId: item.inferredCompanyId || "",
      evidence: item.reason,
      confidence: item.confidence,
      ownerDecision: "MANUAL_REVIEW",
      approvedCompanyId: "",
      decisionReason: "",
      approvedBy: "",
      approvedAt: "",
      action: "REVIEW_LATER",
    };
  }));
  writeCsv(path.join(reconciliationDir, "project-company-mapping.template.csv"), projectHeaders, []);
  writeCsv(path.join(reconciliationDir, "project-company-mapping.draft.csv"), projectHeaders, rows);
  return rows.length;
}

async function writeJournalMappings() {
  const dryRun = readJson<{ plan: JournalPlan[] }>("docs/audit/phase25-journal-project-backfill-dry-run.json");
  const rows = [];
  for (const item of dryRun.plan) {
    const journal = await prisma.journalEntry.findUnique({
      where: { id: item.journalEntryId },
      select: { id: true, projectId: true, description: true, sourceType: true, sourceId: true, date: true, isReversed: true },
    });
    const cashDoc = item.sourceType === "CASH_BANK" && item.sourceId
      ? await prisma.cashBankDocument.findUnique({
        where: { id: item.sourceId },
        select: { id: true, documentNo: true, description: true, partnerName: true, amount: true, projectId: true, contractId: true },
      })
      : null;
    const amounts = await journalAmounts(item.journalEntryId);
    rows.push({
      journalEntryId: item.journalEntryId,
      journalDate: journal?.date.toISOString() || item.journalDate,
      sourceType: item.sourceType || "",
      sourceId: item.sourceId || "",
      description: journal?.description || cashDoc?.description || "",
      amountDebit: amounts.amountDebit,
      amountCredit: amounts.amountCredit,
      currentProjectId: journal?.projectId || "",
      suggestedProjectId: item.inferredProjectId || cashDoc?.projectId || "",
      cashBankDocumentId: cashDoc?.id || "",
      cashBankDocumentNo: cashDoc?.documentNo || "",
      counterparty: cashDoc?.partnerName || "",
      evidence: `${item.reason}${cashDoc?.contractId ? ` Contract liên quan: ${cashDoc.contractId}` : ""}${journal?.isReversed ? " Journal reversed." : ""} Accounts: ${amounts.accounts}`,
      ownerDecision: "MANUAL_REVIEW",
      approvedProjectId: "",
      nonProjectReason: "",
      decisionReason: "",
      approvedBy: "",
      approvedAt: "",
      action: "REVIEW_LATER",
    });
  }
  writeCsv(path.join(reconciliationDir, "journal-project-mapping.template.csv"), journalHeaders, []);
  writeCsv(path.join(reconciliationDir, "journal-project-mapping.draft.csv"), journalHeaders, rows);
  return rows.length;
}

async function writeApMappings() {
  const projectId = "project-battrang";
  const apCodes = ["331", "3310", "3311", "3318"];
  const journals = await prisma.journalEntry.findMany({
    where: { projectId, deletedAt: null, isPosted: true },
    include: { lines: { include: { account: true } } },
    orderBy: { date: "asc" },
  });
  const rows = [];
  for (const journal of journals) {
    for (const line of journal.lines.filter(line => apCodes.some(code => line.account.code.startsWith(code)))) {
      const sourceType = journal.sourceType || "";
      const sourceId = journal.sourceId || "";
      const cost = sourceType === "COST" && sourceId ? await prisma.costRecord.findUnique({ where: { id: sourceId }, select: { id: true, amount: true, purchaseOrderId: true } }) : null;
      const payment = sourceType === "PAYMENT" && sourceId ? await prisma.payment.findUnique({ where: { id: sourceId }, select: { id: true, amount: true, contractId: true } }) : null;
      const contractId = payment?.contractId || "";
      const contract = contractId ? await prisma.contract.findUnique({ where: { id: contractId }, select: { supplierId: true } }) : null;
      const operationalAmount = Number(cost?.amount || payment?.amount || 0);
      const signedAmount = line.type === "CREDIT" ? -Number(line.amount) : Number(line.amount);
      const isHighlighted = [
        "PAYMENT:6a96a3dd-8099-4f20-bc9a-d745dc5d5974",
        "COST:ddfef388-ee53-4335-85fd-eaaf4616302f",
        "PAYMENT:5912d36d-b5f0-432d-9c8d-1b58e85040b9",
      ].includes(`${sourceType}:${sourceId}`);
      rows.push({
        sourceType,
        sourceId,
        journalEntryId: journal.id,
        journalDate: journal.date.toISOString(),
        accountCode: line.account.code,
        debitCredit: line.type,
        amount: Number(line.amount),
        signedAmount,
        isReversed: journal.isReversed ? "TRUE" : "FALSE",
        description: `${isHighlighted ? "[TOP_SOURCE] " : ""}${journal.description}`,
        linkedCostId: cost?.id || "",
        linkedPaymentId: payment?.id || "",
        linkedContractId: contractId,
        linkedSupplierId: contract?.supplierId || "",
        operationalRecordExists: cost || payment ? "TRUE" : "FALSE",
        operationalAmount,
        ledgerAmount: signedAmount,
        variance: signedAmount - operationalAmount,
        ownerDecision: "MANUAL_REVIEW",
        mappingAction: "NO_ACTION",
        decisionReason: "",
        approvedBy: "",
        approvedAt: "",
      });
    }
  }
  writeCsv(path.join(reconciliationDir, "project-battrang-ap-reconciliation.template.csv"), apHeaders, []);
  writeCsv(path.join(reconciliationDir, "project-battrang-ap-reconciliation.draft.csv"), apHeaders, rows);
  return rows.length;
}

function writeWorkbook(projectRows: number, journalRows: number, apRows: number) {
  const workbook = `# MANUAL RECONCILIATION WORKBOOK

Ngày tạo: ${new Date().toISOString()}

## 1. Project Company Mapping

Có ${projectRows} công trình cần kế toán/owner dữ liệu xác nhận company scope.

File cần điền:

- \`docs/reconciliation/project-company-mapping.draft.csv\`

Cách điền:

1. Xác định công ty đúng cho từng công trình từ hồ sơ nội bộ, hợp đồng, chứng từ nguồn hoặc quyết định quản lý.
2. Nếu chắc chắn, điền \`ownerDecision=APPROVED_FOR_BACKFILL\`, \`approvedCompanyId\`, \`decisionReason\`, \`approvedBy\`, \`approvedAt\`, \`action=BACKFILL_COMPANY\`.
3. Nếu là dữ liệu legacy không còn dùng, chọn \`ARCHIVED_LEGACY\` và \`NO_ACTION\`.
4. Không điền đại company mặc định nếu không có bằng chứng.

## 2. Journal Project Mapping

Có ${journalRows} posted journal cần xác nhận thuộc công trình hay nghiệp vụ tài chính chung.

File cần điền:

- \`docs/reconciliation/journal-project-mapping.draft.csv\`

Cách xác định:

- Nếu chứng từ cash/bank thanh toán cho công trình cụ thể, điền \`APPROVED_FOR_BACKFILL\`, \`approvedProjectId\`, \`action=BACKFILL_PROJECT\`.
- Nếu là nghiệp vụ tài chính chung không thuộc công trình, điền \`ownerDecision=NON_PROJECT_FINANCE\`, \`action=MARK_NON_PROJECT\`, và bắt buộc có \`nonProjectReason\`.
- Nếu chưa đủ chứng từ đối chiếu, giữ \`MANUAL_REVIEW\`.

## 3. AP Bát Tràng

Có ${apRows} dòng AP ledger cần kế toán xác nhận.

File cần điền:

- \`docs/reconciliation/project-battrang-ap-reconciliation.draft.csv\`

Số liệu Phase 2.5:

- Ledger AP theo reconciliation: \`-8.286.592\`
- Operational AP theo reconciliation: \`0\`
- Variance: \`8.286.592\`
- AP từ TransactionLine forensic: \`52.256.741\`
- AP thuộc journal reversed: \`43.970.149\`

Câu hỏi cần trả lời:

1. Operational AP phải tính từ bảng nào?
2. Các dòng payment/cost top source đã được đối trừ đúng chưa?
3. Dòng reversed có đang bị policy reconciliation xử lý đúng chưa?
4. Cần sửa query operational, review ledger, hay lập proposal điều chỉnh?

## 4. Hướng dẫn apply sau khi xác nhận

\`\`\`bash
npx tsx scripts/reconciliation/validate-project-company-mapping.ts
npx tsx scripts/reconciliation/apply-project-company-mapping.ts
npx tsx scripts/reconciliation/validate-journal-project-mapping.ts
npx tsx scripts/reconciliation/apply-journal-project-mapping.ts
npx tsx scripts/reconciliation/validate-project-battrang-ap-decision.ts
npm run validation:database
\`\`\`

## 5. Cảnh báo

- Không điền đại company/project.
- Không sửa AP bằng tay nếu chưa có đối chiếu chứng từ.
- Không tạo adjustment nếu chưa có kế toán trưởng xác nhận.
- Chỉ dòng \`APPROVED_FOR_BACKFILL\` mới được apply dữ liệu.
`;
  fs.writeFileSync(path.join(reconciliationDir, "MANUAL_RECONCILIATION_WORKBOOK.md"), workbook, "utf8");
}

async function main() {
  ensureDirs();
  const projectRows = await writeProjectMappings();
  const journalRows = await writeJournalMappings();
  const apRows = await writeApMappings();
  writeWorkbook(projectRows, journalRows, apRows);
  console.log(JSON.stringify({ status: "PASS", projectRows, journalRows, apRows }, null, 2));
}

main().catch(error => {
  console.error("FAIL generate-manual-reconciliation-workbook");
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
