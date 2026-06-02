import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";

export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "MANUAL_REVIEW";

export type ProjectCompanyPlan = {
  projectId: string;
  projectCode: string;
  projectName: string;
  inferredCompanyId: string | null;
  confidence: Confidence;
  reason: string;
  action: "BACKFILL" | "SKIP" | "MANUAL_REVIEW";
};

export type JournalProjectPlan = {
  journalEntryId: string;
  sourceType: string | null;
  sourceId: string | null;
  journalDate: string;
  inferredProjectId: string | null;
  confidence: Confidence;
  reason: string;
  action: "BACKFILL" | "SKIP" | "MANUAL_REVIEW";
};

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function ensureAuditDir() {
  fs.mkdirSync(path.join(process.cwd(), "docs", "audit"), { recursive: true });
}

export function writeAuditJson(filename: string, data: unknown) {
  ensureAuditDir();
  fs.writeFileSync(path.join(process.cwd(), "docs", "audit", filename), JSON.stringify(data, null, 2), "utf8");
}

export async function inferProjectCompany(project: { id: string; name: string; branchId?: string | null }): Promise<ProjectCompanyPlan> {
  const [
    branch,
    costs,
    invoices,
    advances,
    cashDocs,
    inventoryDocs,
    taxInvoices,
  ] = await Promise.all([
    project.branchId ? prisma.branch.findUnique({ where: { id: project.branchId }, select: { companyId: true } }) : null,
    prisma.costRecord.findMany({ where: { projectId: project.id, deletedAt: null, companyId: { not: null } }, select: { companyId: true } }),
    prisma.invoice.findMany({ where: { projectId: project.id, deletedAt: null, companyId: { not: null } }, select: { companyId: true } }),
    prisma.advanceRequest.findMany({ where: { projectId: project.id, deletedAt: null, companyId: { not: null } }, select: { companyId: true } }),
    prisma.cashBankDocument.findMany({ where: { projectId: project.id, deletedAt: null, companyId: { not: null } }, select: { companyId: true } }),
    prisma.inventoryDocument.findMany({ where: { projectId: project.id, deletedAt: null }, select: { companyId: true } }),
    prisma.taxInvoice.findMany({ where: { projectId: project.id, deletedAt: null, companyId: { not: null } }, select: { companyId: true } }),
  ]);

  const candidates = unique([
    branch?.companyId,
    ...costs.map(item => item.companyId),
    ...invoices.map(item => item.companyId),
    ...advances.map(item => item.companyId),
    ...cashDocs.map(item => item.companyId),
    ...inventoryDocs.map(item => item.companyId),
    ...taxInvoices.map(item => item.companyId),
  ]);

  const evidenceCount = costs.length + invoices.length + advances.length + cashDocs.length + inventoryDocs.length + taxInvoices.length + (branch?.companyId ? 1 : 0);
  if (candidates.length === 1) {
    return {
      projectId: project.id,
      projectCode: project.id,
      projectName: project.name,
      inferredCompanyId: candidates[0],
      confidence: "HIGH",
      reason: `Một companyId duy nhất được suy luận từ ${evidenceCount} nguồn liên quan.`,
      action: "BACKFILL",
    };
  }

  if (candidates.length > 1) {
    return {
      projectId: project.id,
      projectCode: project.id,
      projectName: project.name,
      inferredCompanyId: null,
      confidence: "MANUAL_REVIEW",
      reason: `Phát hiện nhiều companyId liên quan: ${candidates.join(", ")}.`,
      action: "MANUAL_REVIEW",
    };
  }

  return {
    projectId: project.id,
    projectCode: project.id,
    projectName: project.name,
    inferredCompanyId: null,
    confidence: "MANUAL_REVIEW",
    reason: "Không có bằng chứng companyId từ branch hoặc chứng từ liên quan; không dùng default company để tránh đoán dữ liệu.",
    action: "MANUAL_REVIEW",
  };
}

export async function buildProjectCompanyPlan() {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null, companyId: null },
    select: { id: true, name: true, branchId: true },
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(projects.map(inferProjectCompany));
}

async function sourceProjectFromJournal(sourceType: string | null, sourceId: string | null) {
  if (!sourceType || !sourceId) return { projectIds: [], reason: "Journal thiếu sourceType/sourceId." };
  const normalized = sourceType.toUpperCase().replace(/[\s-]/g, "_");

  if (normalized.includes("COST")) {
    const cost = await prisma.costRecord.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([cost?.projectId]), reason: "Suy luận từ CostRecord.projectId." };
  }
  if (normalized.includes("INVOICE")) {
    const invoice = await prisma.invoice.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([invoice?.projectId]), reason: "Suy luận từ Invoice.projectId." };
  }
  if (normalized.includes("PAYMENT")) {
    const payment = await prisma.payment.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([payment?.projectId]), reason: "Suy luận từ Payment.projectId." };
  }
  if (normalized.includes("ADVANCE_SETTLEMENT") || normalized.includes("SETTLEMENT")) {
    const settlement = await prisma.advanceSettlement.findUnique({
      where: { id: sourceId },
      select: {
        advanceRequest: { select: { projectId: true } },
        invoiceId: true,
        costRecordId: true,
        paymentId: true,
        contractId: true,
      },
    });
    const [invoice, cost, payment, contract] = await Promise.all([
      settlement?.invoiceId ? prisma.invoice.findUnique({ where: { id: settlement.invoiceId }, select: { projectId: true } }) : null,
      settlement?.costRecordId ? prisma.costRecord.findUnique({ where: { id: settlement.costRecordId }, select: { projectId: true } }) : null,
      settlement?.paymentId ? prisma.payment.findUnique({ where: { id: settlement.paymentId }, select: { projectId: true } }) : null,
      settlement?.contractId ? prisma.contract.findUnique({ where: { id: settlement.contractId }, select: { projectId: true } }) : null,
    ]);
    return {
      projectIds: unique([settlement?.advanceRequest?.projectId, invoice?.projectId, cost?.projectId, payment?.projectId, contract?.projectId]),
      reason: "Suy luận từ AdvanceSettlement và chứng từ liên quan.",
    };
  }
  if (normalized.includes("ADVANCE")) {
    const advance = await prisma.advanceRequest.findUnique({
      where: { id: sourceId },
      select: { projectId: true, contract: { select: { projectId: true } } },
    });
    return { projectIds: unique([advance?.projectId, advance?.contract?.projectId]), reason: "Suy luận từ AdvanceRequest.projectId/contract." };
  }
  if (normalized.includes("CONTRACT")) {
    const contract = await prisma.contract.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([contract?.projectId]), reason: "Suy luận từ Contract.projectId." };
  }
  if (normalized.includes("WBS")) {
    const wbs = await prisma.wBSItem.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([wbs?.projectId]), reason: "Suy luận từ WBSItem.projectId." };
  }
  if (normalized.includes("CASH") || normalized.includes("BANK")) {
    const doc = await prisma.cashBankDocument.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([doc?.projectId]), reason: "Suy luận từ CashBankDocument.projectId." };
  }
  if (normalized.includes("INVENTORY")) {
    const doc = await prisma.inventoryDocument.findUnique({ where: { id: sourceId }, select: { projectId: true } });
    return { projectIds: unique([doc?.projectId]), reason: "Suy luận từ InventoryDocument.projectId." };
  }

  return { projectIds: [], reason: `Chưa có rule suy luận cho sourceType ${sourceType}.` };
}

export async function inferJournalProject(journal: {
  id: string;
  sourceType: string | null;
  sourceId: string | null;
  date: Date;
}): Promise<JournalProjectPlan> {
  const source = await sourceProjectFromJournal(journal.sourceType, journal.sourceId);
  if (source.projectIds.length === 1) {
    return {
      journalEntryId: journal.id,
      sourceType: journal.sourceType,
      sourceId: journal.sourceId,
      journalDate: journal.date.toISOString(),
      inferredProjectId: source.projectIds[0],
      confidence: "HIGH",
      reason: source.reason,
      action: "BACKFILL",
    };
  }
  if (source.projectIds.length > 1) {
    return {
      journalEntryId: journal.id,
      sourceType: journal.sourceType,
      sourceId: journal.sourceId,
      journalDate: journal.date.toISOString(),
      inferredProjectId: null,
      confidence: "MANUAL_REVIEW",
      reason: `Nhiều projectId ứng viên: ${source.projectIds.join(", ")}.`,
      action: "MANUAL_REVIEW",
    };
  }
  return {
    journalEntryId: journal.id,
    sourceType: journal.sourceType,
    sourceId: journal.sourceId,
    journalDate: journal.date.toISOString(),
    inferredProjectId: null,
    confidence: "MANUAL_REVIEW",
    reason: source.reason,
    action: "MANUAL_REVIEW",
  };
}

export async function buildJournalProjectPlan() {
  const journals = await prisma.journalEntry.findMany({
    where: { deletedAt: null, isPosted: true, projectId: null },
    select: { id: true, sourceType: true, sourceId: true, date: true },
    orderBy: { date: "asc" },
  });
  return Promise.all(journals.map(inferJournalProject));
}

export { prisma };
