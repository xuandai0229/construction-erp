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
  revenue: "Doanh thu",
  cost: "Chi phí",
  profit: "Lãi/lỗ",
  receivables: "Công nợ phải thu",
  payables: "Công nợ phải trả",
  payments: "Thanh toán",
  advances: "Tạm ứng",
  contractValue: "Giá trị hợp đồng",
  budget: "Ngân sách"
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

function hasHumanApprovalWarning(metric: MetricKey, journalEntries: Array<{ sourceType: string | null; description: string }>) {
  if (metric === "payables" || metric === "advances") return true;
  return journalEntries.some((entry) => {
    const text = `${entry.sourceType || ""} ${entry.description || ""}`.toUpperCase();
    return text.includes("CASH_BANK") || text.includes("BÁT TRÀNG") || text.includes("BAT TRANG") || text.includes("RECONCILIATION");
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const metricInput = searchParams.get("metric") || "";
    const projectId = searchParams.get("projectId") || undefined;

    if (!isMetricKey(metricInput)) {
      throw new ApiError(400, "Thiếu hoặc sai chỉ tiêu truy vết tài chính.");
    }

    const metric = metricInput;
    const companyId = user.companyId || undefined;
    const project = projectId ? await requireProjectAccess(user, projectId) : null;

    const projectWhere = projectId
      ? { projectId }
      : companyId
      ? { companyId }
      : {};

    const journalProjectWhere = projectId
      ? { projectId }
      : companyId
      ? { project: { companyId } }
      : {};

    const sourceTypes = getSourceTypes(metric);

    const [invoices, payments, costs, advances, contracts, budgets, journalEntries] = await Promise.all([
      metric === "revenue" || metric === "receivables" || metric === "profit"
        ? prisma.invoice.findMany({
            where: { ...projectWhere, deletedAt: null, OR: [{ status: { in: ["SENT", "PARTIAL", "PAID", "OVERDUE"] } }, { approvalStatus: "APPROVED" }] },
            include: { contract: { include: { supplier: true } }, wbs: true },
            orderBy: { issuedDate: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      metric === "payments" || metric === "receivables" || metric === "payables"
        ? prisma.payment.findMany({
            where: { ...projectWhere, deletedAt: null, approvalStatus: "APPROVED" },
            include: { invoice: true, contract: { include: { supplier: true } } },
            orderBy: { date: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      metric === "cost" || metric === "payables" || metric === "profit"
        ? prisma.costRecord.findMany({
            where: { ...projectWhere, deletedAt: null, approvalStatus: "APPROVED" },
            include: { wbs: true },
            orderBy: { date: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      metric === "advances"
        ? prisma.advanceRequest.findMany({
            where: { ...projectWhere, deletedAt: null, status: { in: ["APPROVED", "PAID", "PARTIALLY_SETTLED", "FULLY_SETTLED"] } },
            include: { contract: { include: { supplier: true } }, supplier: true, settlements: true },
            orderBy: { createdAt: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      metric === "contractValue"
        ? prisma.contract.findMany({
            where: { ...projectWhere, deletedAt: null },
            include: { supplier: true, project: true },
            orderBy: { createdAt: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      metric === "budget"
        ? prisma.budgetRecord.findMany({
            where: { ...projectWhere, deletedAt: null },
            include: { wbs: true },
            orderBy: { createdAt: "desc" },
            take: 25
          })
        : Promise.resolve([]),
      prisma.journalEntry.findMany({
        where: {
          ...journalProjectWhere,
          deletedAt: null,
          isPosted: true,
          isReversed: false,
          sourceType: { in: sourceTypes }
        },
        include: {
          lines: {
            where: { deletedAt: null },
            include: { account: true }
          },
          project: { select: { id: true, name: true } }
        },
        orderBy: { date: "desc" },
        take: 25
      })
    ]);

    const sourceDocuments = [
      ...invoices.map((item) => ({
        id: item.id,
        sourceType: "INVOICE",
        date: item.issuedDate,
        number: item.invoiceNumber || item.id.slice(0, 8),
        projectId: item.projectId,
        projectName: project?.id === item.projectId ? undefined : null,
        partnerName: item.contract?.supplier?.name || "Chủ đầu tư/khách hàng",
        contractName: item.contract?.title || item.contractId || "",
        description: item.note || "Hóa đơn/giá trị nghiệm thu",
        amount: money(item.amount),
        status: item.status || item.approvalStatus
      })),
      ...payments.map((item) => ({
        id: item.id,
        sourceType: "PAYMENT",
        date: item.date,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        partnerName: item.contract?.supplier?.name || "Khách hàng/NCC",
        contractName: item.contract?.title || item.invoice?.invoiceNumber || "",
        description: item.description || "Thanh toán",
        amount: money(item.amount),
        status: item.approvalStatus
      })),
      ...costs.map((item) => ({
        id: item.id,
        sourceType: "COST",
        date: item.date,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        partnerName: item.supplier || "",
        contractName: item.wbs?.name || "",
        description: item.note || "Chi phí công trình",
        amount: money(item.amount),
        status: item.approvalStatus
      })),
      ...advances.map((item) => ({
        id: item.id,
        sourceType: "ADVANCE",
        date: item.createdAt,
        number: item.advanceNo || item.id.slice(0, 8),
        projectId: item.projectId,
        partnerName: item.supplier?.name || item.contract?.supplier?.name || "",
        contractName: item.contract?.title || "",
        description: item.purpose || "Tạm ứng",
        amount: money(item.amount),
        status: item.status
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
        status: item.status
      })),
      ...budgets.map((item) => ({
        id: item.id,
        sourceType: "BUDGET",
        date: item.createdAt,
        number: item.id.slice(0, 8),
        projectId: item.projectId,
        partnerName: "",
        contractName: item.wbs?.name || "",
        description: `Dự toán ${item.costType}`,
        amount: money(item.estimatedAmount),
        status: "APPROVED"
      }))
    ].slice(0, 25);

    const totalAmount = sourceDocuments.reduce((sum, item) => {
      if (metric === "profit" && item.sourceType === "COST") return sum - item.amount;
      return sum + item.amount;
    }, 0);

    const warnings = hasHumanApprovalWarning(metric, journalEntries)
      ? [
          "Dữ liệu đối soát này đang chờ kế toán/owner xác nhận. Không dùng làm sổ kế toán thật.",
          "Cần rà soát project/company mapping, CASH_BANK journal mapping và AP Bát Tràng nếu chỉ tiêu liên quan."
        ]
      : [];

    return successResponse({
      metric,
      title: METRIC_LABELS[metric],
      project: projectId ? await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, name: true } }) : null,
      sourceOfTruth: "Pilot read-only: ledger posted và chứng từ đã duyệt/đã ghi sổ theo dữ liệu hiện có",
      totalAmount,
      sourceDocuments,
      journalEntries: journalEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        reference: entry.reference || entry.id.slice(0, 8),
        description: entry.description,
        status: entry.status,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        projectName: entry.project?.name || "",
        lines: entry.lines.map((line) => ({
          id: line.id,
          accountCode: line.account.code,
          accountName: line.account.name,
          type: line.type,
          amount: money(line.amount),
          description: line.description || ""
        }))
      })),
      auditTrail: [],
      warnings
    });
  } catch (error) {
    return handleApiError(error);
  }
}
