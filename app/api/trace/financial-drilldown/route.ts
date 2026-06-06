import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

type MetricKey =
  | "revenue"
  | "cost"
  | "profit"
  | "receivables"
  | "payables"
  | "payments"
  | "advances"
  | "contractValue"
  | "budget";

const METRIC_LABELS: Record<MetricKey, string> = {
  revenue: "Doanh thu hạch toán",
  cost: "Chi phí sản xuất",
  profit: "Lợi nhuận gộp tạm tính",
  receivables: "Công nợ phải thu",
  payables: "Công nợ phải trả",
  payments: "Dòng tiền thuần",
  advances: "Tạm ứng công trình",
  contractValue: "Giá trị hợp đồng",
  budget: "Dự toán",
};

function isMetricKey(value: string): value is MetricKey {
  return value in METRIC_LABELS;
}

function money(value: unknown) {
  return Number(value || 0);
}

function getSourceTypes(metric: MetricKey) {
  if (metric === "revenue" || metric === "receivables") return ["INVOICE", "TAX_INVOICE"];
  if (metric === "cost" || metric === "payables") return ["COST", "VENDOR_PAYMENT"];
  if (metric === "payments") return ["PAYMENT", "VENDOR_PAYMENT", "CASH_BANK"];
  if (metric === "advances") return ["ADVANCE", "ADVANCE_SETTLEMENT"];
  if (metric === "contractValue") return ["CONTRACT"];
  return ["COST", "INVOICE", "PAYMENT", "ADVANCE", "CONTRACT"];
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const metricInput = searchParams.get("metric") || "";
    const projectId = searchParams.get("projectId") || undefined;

    if (!isMetricKey(metricInput)) {
      throw new ApiError(400, "Thiếu hoặc sai chỉ tiêu tài chính.");
    }

    const metric = metricInput;
    const companyId = user.companyId || undefined;
    if (projectId) await requireProjectAccess(user, projectId);
    const projectRecord = projectId ? await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, name: true } }) : null;

    const projectWhere = projectId ? { projectId } : companyId ? { companyId } : {};
    const journalProjectWhere = projectId ? { projectId } : companyId ? { project: { companyId } } : {};
    const sourceTypes = getSourceTypes(metric);

    const [invoices, payments, costs, advances, contracts, budgets, journalEntries] = await Promise.all([
      metric === "revenue" || metric === "receivables" || metric === "profit"
        ? prisma.invoice.findMany({
            where: { ...projectWhere, deletedAt: null, OR: [{ status: { in: ["SENT", "PARTIAL", "PAID", "OVERDUE"] } }, { approvalStatus: "APPROVED" }] },
            include: { contract: { include: { supplier: true, project: true } }, wbs: { include: { project: true } } },
            orderBy: { issuedDate: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      metric === "payments" || metric === "receivables" || metric === "payables"
        ? prisma.payment.findMany({
            where: { ...projectWhere, deletedAt: null, approvalStatus: "APPROVED" },
            include: { invoice: true, contract: { include: { supplier: true, project: true } } },
            orderBy: { date: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      metric === "cost" || metric === "payables" || metric === "profit"
        ? prisma.costRecord.findMany({
            where: { ...projectWhere, deletedAt: null, approvalStatus: "APPROVED" },
            include: { wbs: { include: { project: true } } },
            orderBy: { date: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      metric === "advances"
        ? prisma.advanceRequest.findMany({
            where: { ...projectWhere, deletedAt: null, status: { in: ["APPROVED", "PAID", "PARTIALLY_SETTLED", "FULLY_SETTLED"] } },
            include: { contract: { include: { supplier: true, project: true } }, supplier: true, settlements: true, project: true },
            orderBy: { createdAt: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      metric === "contractValue"
        ? prisma.contract.findMany({
            where: { ...projectWhere, deletedAt: null },
            include: { supplier: true, project: true },
            orderBy: { createdAt: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      metric === "budget"
        ? prisma.budgetRecord.findMany({
            where: { ...projectWhere, deletedAt: null },
            include: { wbs: { include: { project: true } } },
            orderBy: { createdAt: "desc" },
            take: 25,
          })
        : Promise.resolve([]),
      prisma.journalEntry.findMany({
        where: {
          ...journalProjectWhere,
          deletedAt: null,
          isPosted: true,
          isReversed: false,
          sourceType: { in: sourceTypes },
        },
        include: {
          lines: {
            where: { deletedAt: null },
            include: { account: true },
          },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 25,
      }),
    ]);

    const sourceDocuments = [
      ...invoices.map((item) => ({
        id: item.id,
        sourceType: "INVOICE",
        date: item.issuedDate,
        number: item.invoiceNumber || item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.contract?.project?.name || item.wbs?.project?.name || projectRecord?.name || null,
        partnerName: item.contract?.supplier?.name || item.contract?.project?.investor || "Khách hàng/chủ đầu tư",
        contractName: item.contract?.title || item.contractId || "",
        description: item.note || "Hóa đơn/giá trị nghiệm thu",
        amount: money(item.amount),
        status: item.status || item.approvalStatus,
      })),
      ...payments.map((item) => ({
        id: item.id,
        sourceType: "PAYMENT",
        date: item.date,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.contract?.project?.name || projectRecord?.name || null,
        partnerName: item.contract?.supplier?.name || "Khách hàng/Nhà cung cấp",
        contractName: item.contract?.title || item.invoice?.invoiceNumber || "",
        description: item.description || "Thanh toán",
        amount: money(item.amount),
        status: item.approvalStatus,
      })),
      ...costs.map((item) => ({
        id: item.id,
        sourceType: "COST",
        date: item.date,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.wbs?.project?.name || projectRecord?.name || null,
        partnerName: item.supplier || "",
        contractName: item.wbs?.name || "",
        description: item.note || "Chi phí công trình",
        amount: money(item.amount),
        status: item.approvalStatus,
      })),
      ...advances.map((item) => ({
        id: item.id,
        sourceType: "ADVANCE",
        date: item.createdAt,
        number: item.advanceNo || item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.project?.name || item.contract?.project?.name || projectRecord?.name || null,
        partnerName: item.supplier?.name || item.contract?.supplier?.name || "",
        contractName: item.contract?.title || "",
        description: item.purpose || "Tạm ứng",
        amount: money(item.amount),
        status: item.status,
      })),
      ...contracts.map((item) => ({
        id: item.id,
        sourceType: "CONTRACT",
        date: item.signedDate || item.createdAt,
        number: item.contractNumber || item.contractCode || item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.project?.name,
        partnerName: item.supplier?.name || item.contractorName || "",
        contractName: item.title,
        description: item.description || "Hợp đồng",
        amount: money(item.currentValue || item.originalValue),
        status: item.status,
      })),
      ...budgets.map((item) => ({
        id: item.id,
        sourceType: "BUDGET",
        date: item.createdAt,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: item.wbs?.project?.name || projectRecord?.name || null,
        partnerName: "",
        contractName: item.wbs?.name || "",
        description: `Dự toán ${item.costType}`,
        amount: money(item.estimatedAmount),
        status: "APPROVED",
      })),
    ].slice(0, 25);

    const totalAmount = sourceDocuments.reduce((sum, item) => {
      if (metric === "profit" && item.sourceType === "COST") return sum - item.amount;
      return sum + item.amount;
    }, 0);

    return successResponse({
      metric,
      title: METRIC_LABELS[metric],
      project: projectRecord,
      sourceOfTruth: "Chứng từ đã phê duyệt và bút toán đã ghi nhận",
      totalAmount,
      sourceDocuments,
      journalEntries: journalEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        reference: entry.reference || entry.id.slice(0, 8),
        description: entry.description,
        status: entry.status,
        projectName: entry.project?.name || "",
        lines: entry.lines.map((line) => ({
          id: line.id,
          accountCode: line.account.code,
          accountName: line.account.name,
          type: line.type,
          amount: money(line.amount),
          description: line.description || "",
        })),
      })),
      auditTrail: [],
      warnings: [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
