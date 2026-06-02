import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";

type SourceType =
  | "COST"
  | "INVOICE"
  | "PAYMENT"
  | "ADVANCE"
  | "ADVANCE_SETTLEMENT"
  | "CONTRACT"
  | "SUPPLIER"
  | "WBS";

function normalizeSourceType(value: string): SourceType {
  return value.trim().toUpperCase() as SourceType;
}

async function getProject(projectId?: string | null) {
  if (!projectId) return null;
  return prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, name: true, companyId: true, status: true, contractValue: true, totalBudget: true }
  });
}

async function getJournalEntries(sourceType: string, sourceId: string) {
  return prisma.journalEntry.findMany({
    where: {
      deletedAt: null,
      OR: [
        { sourceType, sourceId },
        { sourceType: `${sourceType}_REVERSAL`, sourceId }
      ]
    },
    include: {
      lines: {
        where: { deletedAt: null },
        include: { account: true }
      }
    },
    orderBy: { date: "asc" }
  });
}

async function getAuditTrail(entity: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: {
      OR: [
        { entity, entityId },
        { entityId }
      ]
    },
    orderBy: { timestamp: "desc" },
    take: 50
  });
}

export async function getSourceDocumentTrace(sourceTypeInput: string, sourceId: string) {
  const sourceType = normalizeSourceType(sourceTypeInput);
  let sourceDocument: any = null;
  let projectId: string | null | undefined;
  let contractId: string | null | undefined;
  let supplierId: string | null | undefined;
  let wbsItemId: string | null | undefined;
  let entity: string = sourceType;

  if (sourceType === "COST") {
    sourceDocument = await prisma.costRecord.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { wbs: true, purchaseOrder: true, vendorPayments: true }
    });
    entity = "CostRecord";
    projectId = sourceDocument?.projectId;
    wbsItemId = sourceDocument?.wbsId;
  } else if (sourceType === "INVOICE") {
    sourceDocument = await prisma.invoice.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { contract: { include: { supplier: true } }, wbs: true, payments: true, allocations: true }
    });
    entity = "Invoice";
    projectId = sourceDocument?.projectId;
    contractId = sourceDocument?.contractId;
    supplierId = sourceDocument?.contract?.supplierId;
    wbsItemId = sourceDocument?.wbsId;
  } else if (sourceType === "PAYMENT") {
    sourceDocument = await prisma.payment.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { invoice: { include: { wbs: true, contract: { include: { supplier: true } } } }, contract: { include: { supplier: true } }, allocations: true }
    });
    entity = "Payment";
    projectId = sourceDocument?.projectId;
    contractId = sourceDocument?.contractId || sourceDocument?.invoice?.contractId;
    supplierId = sourceDocument?.contract?.supplierId || sourceDocument?.invoice?.contract?.supplierId;
    wbsItemId = sourceDocument?.invoice?.wbsId;
  } else if (sourceType === "ADVANCE") {
    sourceDocument = await prisma.advanceRequest.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { contract: { include: { supplier: true } }, supplier: true, settlements: true }
    });
    entity = "AdvanceRequest";
    projectId = sourceDocument?.projectId;
    contractId = sourceDocument?.contractId;
    supplierId = sourceDocument?.supplierId;
    wbsItemId = sourceDocument?.wbsItemId;
  } else if (sourceType === "ADVANCE_SETTLEMENT") {
    sourceDocument = await prisma.advanceSettlement.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { advanceRequest: { include: { supplier: true, contract: true } }, invoice: true }
    });
    entity = "AdvanceSettlement";
    projectId = sourceDocument?.advanceRequest?.projectId;
    contractId = sourceDocument?.contractId || sourceDocument?.advanceRequest?.contractId;
    supplierId = sourceDocument?.advanceRequest?.supplierId;
    wbsItemId = sourceDocument?.advanceRequest?.wbsItemId;
  } else if (sourceType === "CONTRACT") {
    sourceDocument = await prisma.contract.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { project: true, supplier: true, invoices: true, payments: true, advanceRequests: true, acceptances: true }
    });
    entity = "Contract";
    projectId = sourceDocument?.projectId;
    contractId = sourceDocument?.id;
    supplierId = sourceDocument?.supplierId;
  } else if (sourceType === "SUPPLIER") {
    sourceDocument = await prisma.supplier.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { projects: { include: { project: true } }, contracts: true, advanceRequests: true }
    });
    entity = "Supplier";
    supplierId = sourceDocument?.id;
  } else if (sourceType === "WBS") {
    sourceDocument = await prisma.wBSItem.findFirst({
      where: { id: sourceId, deletedAt: null },
      include: { budgets: true, costs: true, invoices: true, children: true, parent: true }
    });
    entity = "WBSItem";
    projectId = sourceDocument?.projectId;
    wbsItemId = sourceDocument?.id;
  }

  if (!sourceDocument) {
    throw new ApiError(404, "Không tìm thấy chứng từ nguồn để truy vết.");
  }

  const [project, contract, supplier, wbs, journalEntries, auditTrail] = await Promise.all([
    getProject(projectId),
    contractId ? prisma.contract.findFirst({ where: { id: contractId, deletedAt: null }, include: { supplier: true } }) : null,
    supplierId ? prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null } }) : null,
    wbsItemId ? prisma.wBSItem.findFirst({ where: { id: wbsItemId, deletedAt: null }, include: { parent: true } }) : null,
    getJournalEntries(sourceType, sourceId),
    getAuditTrail(entity, sourceId)
  ]);

  return {
    sourceType,
    sourceId,
    sourceDocument,
    project,
    contract,
    supplier,
    wbs,
    journalEntries,
    transactionLines: journalEntries.flatMap(entry => entry.lines.map(line => ({ ...line, journalEntryId: entry.id }))),
    auditTrail,
    status: {
      approvalStatus: sourceDocument.approvalStatus || sourceDocument.status || null,
      isPosted: journalEntries.some(entry => entry.isPosted && !entry.isReversed),
      isReversed: journalEntries.some(entry => entry.isReversed)
    },
    amounts: {
      originalAmount: Number(sourceDocument.amount || sourceDocument.originalValue || sourceDocument.currentValue || 0),
      paidAmount: Number(sourceDocument.paidAmount || sourceDocument.paidAmount === 0 ? sourceDocument.paidAmount : 0),
      remainingAmount: Number(sourceDocument.remainingAmount || 0),
      settledAmount: Number(sourceDocument.settledAmount || 0)
    }
  };
}

export async function getProjectFinancialTrace(projectId: string) {
  const [project, financials, contracts, suppliers, wbsItems, journalCount] = await Promise.all([
    getProject(projectId),
    FinancialAggregationService.getCanonicalProjectFinancials(projectId),
    prisma.contract.findMany({ where: { projectId, deletedAt: null }, include: { supplier: true } }),
    prisma.projectSupplier.findMany({ where: { projectId }, include: { supplier: true } }),
    prisma.wBSItem.findMany({ where: { projectId, deletedAt: null }, orderBy: [{ level: "asc" }, { sortOrder: "asc" }] }),
    prisma.journalEntry.count({ where: { projectId, deletedAt: null } })
  ]);
  if (!project) throw new ApiError(404, "Không tìm thấy dự án.");
  return { project, financials, contracts, suppliers, wbsItems, journalCount };
}

export async function getContractFinancialTrace(contractId: string) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    include: {
      project: true,
      supplier: true,
      invoices: true,
      payments: true,
      advanceRequests: { include: { settlements: true } },
      acceptances: true,
      PaymentAllocation: true
    }
  });
  if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng.");

  const totals = {
    contractValue: Number(contract.currentValue || contract.originalValue || 0),
    accepted: contract.acceptances.reduce((sum, item) => sum + Number(item.amount), 0),
    invoiced: contract.invoices.reduce((sum, item) => sum + Number(item.amount), 0),
    paid: contract.payments.reduce((sum, item) => sum + Number(item.amount), 0),
    advanced: contract.advanceRequests.reduce((sum, item) => sum + Number(item.paidAmount), 0),
    settled: contract.advanceRequests.reduce((sum, item) => sum + Number(item.settledAmount), 0),
    allocated: contract.PaymentAllocation.reduce((sum, item) => sum + Number(item.amount), 0)
  };

  return { contract, totals, remainingContractValue: totals.contractValue - totals.paid - totals.advanced + totals.settled };
}

export async function getSupplierFinancialTrace(supplierId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, deletedAt: null },
    include: {
      projects: { include: { project: true } },
      contracts: { include: { payments: true, invoices: true, advanceRequests: true } },
      advanceRequests: { include: { settlements: true } }
    }
  });
  if (!supplier) throw new ApiError(404, "Không tìm thấy nhà cung cấp.");

  const totals = {
    contractValue: supplier.contracts.reduce((sum, item) => sum + Number(item.currentValue || item.originalValue), 0),
    paid: supplier.contracts.flatMap(item => item.payments).reduce((sum, item) => sum + Number(item.amount), 0),
    advanced: supplier.advanceRequests.reduce((sum, item) => sum + Number(item.paidAmount), 0),
    settled: supplier.advanceRequests.reduce((sum, item) => sum + Number(item.settledAmount), 0)
  };
  return { supplier, totals };
}

export async function getWbsFinancialTrace(wbsItemId: string) {
  const wbs = await prisma.wBSItem.findFirst({
    where: { id: wbsItemId, deletedAt: null },
    include: {
      project: true,
      parent: true,
      children: true,
      budgets: true,
      costs: true,
      invoices: true
    }
  });
  if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS.");

  const totals = {
    budget: wbs.budgets.reduce((sum, item) => sum + Number(item.estimatedAmount), 0),
    costOperational: wbs.costs.reduce((sum, item) => sum + Number(item.amount), 0),
    invoiceOperational: wbs.invoices.reduce((sum, item) => sum + Number(item.amount), 0)
  };
  return { wbs, totals };
}

export async function getArApLedgerReconciliation(projectId: string) {
  const [arDebit, arCredit, apCredit, apDebit, invoiceAgg, costAgg, unallocatedPayments, settlementAgg] = await Promise.all([
    prisma.transactionLine.aggregate({
      where: { account: { code: { startsWith: "131" } }, ...getPostedLedgerLineFilter({ projectId }), type: "DEBIT" },
      _sum: { amount: true }
    }),
    prisma.transactionLine.aggregate({
      where: { account: { code: { startsWith: "131" } }, ...getPostedLedgerLineFilter({ projectId }), type: "CREDIT" },
      _sum: { amount: true }
    }),
    prisma.transactionLine.aggregate({
      where: { account: { code: { startsWith: "331" } }, ...getPostedLedgerLineFilter({ projectId }), type: "CREDIT" },
      _sum: { amount: true }
    }),
    prisma.transactionLine.aggregate({
      where: { account: { code: { startsWith: "331" } }, ...getPostedLedgerLineFilter({ projectId }), type: "DEBIT" },
      _sum: { amount: true }
    }),
    prisma.invoice.aggregate({
      where: { projectId, deletedAt: null, approvalStatus: { in: ["APPROVED"] } },
      _sum: { remainingAmount: true }
    }),
    prisma.costRecord.aggregate({
      where: { projectId, deletedAt: null, approvalStatus: { in: ["APPROVED"] }, status: "unpaid" },
      _sum: { amount: true }
    }),
    prisma.payment.findMany({
      where: {
        projectId,
        deletedAt: null,
        approvalStatus: "APPROVED",
        allocations: { none: { deletedAt: null, isReversed: false } }
      },
      select: { id: true, amount: true, invoiceId: true }
    }),
    prisma.advanceSettlement.groupBy({
      by: ["advanceRequestId"],
      where: {
        deletedAt: null,
        advanceRequest: { projectId }
      },
      _sum: { amount: true }
    })
  ]);

  const arLedger = Number(arDebit._sum.amount || 0) - Number(arCredit._sum.amount || 0);
  const apLedger = Number(apCredit._sum.amount || 0) - Number(apDebit._sum.amount || 0);
  const arOperational = Number(invoiceAgg._sum.remainingAmount || 0);
  const apOperational = Number(costAgg._sum.amount || 0);
  const advanceIds = settlementAgg.map(item => item.advanceRequestId);
  const advances = advanceIds.length > 0
    ? await prisma.advanceRequest.findMany({ where: { id: { in: advanceIds } }, select: { id: true, paidAmount: true, amount: true } })
    : [];
  const advanceMap = new Map(advances.map(item => [item.id, item]));
  const settlementOverAdvance = settlementAgg
    .filter(item => Number(item._sum.amount || 0) > Number(advanceMap.get(item.advanceRequestId)?.paidAmount || advanceMap.get(item.advanceRequestId)?.amount || 0) + 0.01)
    .map(item => ({
      advanceRequestId: item.advanceRequestId,
      settledAmount: Number(item._sum.amount || 0),
      paidAmount: Number(advanceMap.get(item.advanceRequestId)?.paidAmount || 0)
    }));

  return {
    projectId,
    ar: { ledger: arLedger, operational: arOperational, variance: arOperational - arLedger },
    ap: { ledger: apLedger, operational: apOperational, variance: apOperational - apLedger },
    exceptions: {
      unallocatedApprovedPayments: unallocatedPayments,
      settlementOverAdvance
    }
  };
}
