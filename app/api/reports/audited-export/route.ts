import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/api-error";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";
import { ReportingService } from "@/services/reporting.service";
import { auditExportOrThrow, requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { safeDecimal } from "@/lib/math";
import { ApprovalStatus } from "@prisma/client";

const PILOT_COMPANY_NAME = "CÔNG TY CP THƯƠNG MẠI VÀ XÂY DỰNG SỐ 2 HN";

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(escapeCsv).join(","),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(","))
  ].join("\r\n");
}

function formatDate(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatMoney(value: unknown) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function csvResponse(filename: string, rows: Record<string, unknown>[], options?: { title?: string; filters?: Record<string, unknown>; csvFallback?: boolean }) {
  const metadata = options?.title
    ? [
        [PILOT_COMPANY_NAME],
        [options.title],
        [`Ngày xuất: ${formatDate(new Date())}`],
        [options.csvFallback ? "Định dạng: CSV fallback, chưa phải file Excel .xlsx." : "Định dạng: CSV"],
        [options.filters ? `Bộ lọc: ${JSON.stringify(options.filters)}` : ""],
        []
      ].map(row => row.map(escapeCsv).join(",")).join("\r\n")
    : "";
  const table = rows.length > 0 ? toCsv(rows) : toCsv([{ "Trạng thái": "Không có dữ liệu phù hợp với bộ lọc hiện tại." }]);

  return new NextResponse(`\uFEFF${metadata}${metadata ? "\r\n" : ""}${table}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

async function buildAdvancePaymentSummary(projectId: string) {
  const advances = await prisma.advanceRequest.findMany({
    where: { projectId, deletedAt: null },
    include: {
      project: { select: { id: true, name: true } },
      supplier: { select: { code: true, name: true } },
      contract: { select: { contractCode: true, contractNumber: true, title: true, originalValue: true, currentValue: true } },
      settlements: { where: { deletedAt: null } }
    },
    orderBy: { createdAt: "desc" }
  });

  return advances.map((advance, index) => ({
    "STT": index + 1,
    "Tên nhà cung cấp/Người nhận": advance.supplier?.name || advance.employeeId || "Chưa xác định",
    "Mã NCC/Nhân viên": advance.supplier?.code || advance.employeeId || "",
    "Mã công trình": advance.project?.id || advance.projectId || "",
    "Tên công trình": advance.project?.name || "",
    "Hợp đồng": advance.contract?.contractCode || advance.contract?.contractNumber || advance.contract?.title || "",
    "Giá trị hợp đồng": formatMoney(advance.contract?.currentValue || advance.contract?.originalValue || 0),
    "Giá trị nghiệm thu": "",
    "Tạm ứng": formatMoney(advance.amount),
    "Đã thanh toán": formatMoney(advance.paidAmount),
    "Hoàn ứng/Đối trừ": formatMoney(advance.settledAmount),
    "Còn lại": formatMoney(advance.remainingAmount),
    "Ngày chứng từ": formatDate(advance.createdAt),
    "Số chứng từ": advance.advanceNo || advance.id,
    "Số tiền": formatMoney(advance.amount),
    "Diễn giải": advance.purpose || "",
    "Trạng thái": advance.status,
    "Ghi chú": "Báo cáo pilot; dữ liệu reconciliation Phase 2.8 vẫn cần human approval nếu liên quan mapping."
  }));
}

async function buildDebtArApSummary(projectId: string) {
  const [project, invoices, costs] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
    prisma.invoice.findMany({
      where: {
        projectId,
        deletedAt: null,
        status: { in: [...FinancialAggregationService.VALID_INVOICE_STATUSES] },
        approvalStatus: { notIn: ["REJECTED", "CANCELLED"] }
      },
      include: { contract: { select: { title: true, contractCode: true, supplier: true } } },
      orderBy: { issuedDate: "desc" }
    }),
    prisma.costRecord.findMany({
      where: { projectId, deletedAt: null, approvalStatus: ApprovalStatus.APPROVED, workflowStatus: { in: ["APPROVED", "POSTED"] } },
      include: { wbs: { select: { project: { select: { name: true } } } }, vendorPayments: { where: { deletedAt: null, isReversed: false } } },
      orderBy: { date: "desc" }
    })
  ]);

  const arRows = invoices.map((invoice, index) => ({
    "STT": index + 1,
    "Đối tượng": invoice.contract?.supplier?.name || invoice.contract?.title || "Chủ đầu tư/khách hàng",
    "Loại công nợ": "Phải thu",
    "Công trình": project?.name || projectId,
    "Hợp đồng": invoice.contract?.contractCode || invoice.contract?.title || "",
    "Số chứng từ": invoice.invoiceNumber || invoice.id,
    "Ngày chứng từ": formatDate(invoice.issuedDate),
    "Ngày đến hạn": formatDate(invoice.dueDate),
    "Tổng phát sinh": formatMoney(invoice.amount),
    "Đã thu/Đã trả": formatMoney(invoice.paidAmount),
    "Còn lại": formatMoney(invoice.remainingAmount),
    "Quá hạn": invoice.dueDate && Number(invoice.remainingAmount) > 0 && invoice.dueDate < new Date() ? "Có" : "Không",
    "Trạng thái": invoice.status,
    "Ghi chú": "AR từ hóa đơn hợp lệ, không cộng chứng từ REJECTED/CANCELLED."
  }));

  const apRows = costs.map((cost, index) => {
    const paid = cost.vendorPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remaining = Math.max(Number(cost.amount) - paid, 0);
    return {
      "STT": arRows.length + index + 1,
      "Đối tượng": cost.supplier || "Nhà cung cấp",
      "Loại công nợ": "Phải trả",
      "Công trình": cost.wbs.project.name || projectId,
      "Hợp đồng": "",
      "Số chứng từ": cost.id,
      "Ngày chứng từ": formatDate(cost.date),
      "Ngày đến hạn": "",
      "Tổng phát sinh": formatMoney(cost.amount),
      "Đã thu/Đã trả": formatMoney(paid),
      "Còn lại": formatMoney(remaining),
      "Quá hạn": "",
      "Trạng thái": cost.workflowStatus || cost.approvalStatus,
      "Ghi chú": "AP từ chi phí APPROVED/POSTED, không cộng DRAFT/PENDING."
    };
  });

  return [...arRows, ...apRows];
}

async function buildCostByProjectWbs(projectId: string) {
  const costs = await prisma.costRecord.findMany({
    where: { projectId, deletedAt: null, approvalStatus: ApprovalStatus.APPROVED, workflowStatus: { in: ["APPROVED", "POSTED"] } },
    include: { wbs: { select: { code: true, name: true, project: { select: { id: true, name: true } } } }, vendorPayments: { where: { deletedAt: null, isReversed: false } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  return costs.map((cost, index) => ({
    "STT": index + 1,
    "Mã công trình": cost.wbs.project.id,
    "Tên công trình": cost.wbs.project.name,
    "WBS/Hạng mục": `${cost.wbs.code || ""} ${cost.wbs.name}`.trim(),
    "Loại chi phí": cost.costType,
    "Nhà cung cấp": cost.supplier || "",
    "Hợp đồng": "",
    "Số chứng từ": cost.id,
    "Ngày chứng từ": formatDate(cost.date),
    "Số tiền": formatMoney(cost.amount),
    "Trạng thái duyệt": cost.approvalStatus,
    "Trạng thái ghi sổ": cost.workflowStatus,
    "Ghi chú": cost.note || ""
  }));
}

async function buildBudgetVsActual(projectId: string) {
  const [budgets, costs] = await Promise.all([
    prisma.budgetRecord.findMany({
      where: { projectId, deletedAt: null },
      include: { wbs: { select: { code: true, name: true, project: { select: { id: true, name: true } } } } }
    }),
    prisma.costRecord.findMany({
      where: { projectId, deletedAt: null, approvalStatus: ApprovalStatus.APPROVED, workflowStatus: { in: ["APPROVED", "POSTED"] } },
      include: { wbs: { select: { code: true, name: true, project: { select: { id: true, name: true } } } } }
    })
  ]);

  const actualByKey = new Map<string, number>();
  for (const cost of costs) {
    const key = `${cost.wbsId}:${cost.costType}`;
    actualByKey.set(key, (actualByKey.get(key) || 0) + Number(cost.amount));
  }

  return budgets.map((budget, index) => {
    const actual = actualByKey.get(`${budget.wbsId}:${budget.costType}`) || 0;
    const estimated = Number(budget.estimatedAmount);
    const variance = estimated - actual;
    const ratio = estimated > 0 ? `${Math.round((actual / estimated) * 100)}%` : "";
    return {
      "STT": index + 1,
      "Mã công trình": budget.wbs.project.id,
      "Tên công trình": budget.wbs.project.name,
      "WBS/Hạng mục": `${budget.wbs.code || ""} ${budget.wbs.name}`.trim(),
      "Loại chi phí": budget.costType,
      "Dự toán": formatMoney(estimated),
      "Thực chi": formatMoney(actual),
      "Chênh lệch": formatMoney(variance),
      "Tỷ lệ sử dụng": ratio,
      "Trạng thái cảnh báo": estimated > 0 && actual > estimated ? "Vượt dự toán" : "Trong hạn mức",
      "Ghi chú": "Thực chi chỉ tính chi phí APPROVED/POSTED."
    };
  });
}

async function buildRows(reportType: string, projectId: string) {
  switch (reportType) {
    case "REVENUE": {
      const [summary, invoices] = await Promise.all([
        FinancialAggregationService.getCanonicalProjectFinancials(projectId),
        prisma.invoice.findMany({
          where: {
            projectId,
            deletedAt: null,
            status: { in: [...FinancialAggregationService.VALID_INVOICE_STATUSES] },
            approvalStatus: { notIn: ["REJECTED", "CANCELLED"] }
          },
          orderBy: { issuedDate: "desc" },
          include: { wbs: { select: { code: true, name: true } } }
        })
      ]);
      return [
        {
          source: "CANONICAL_SUMMARY",
          postedRevenue_511: summary.postedRevenue,
          totalInvoiced_validInvoices: summary.totalInvoiced,
          collectedCash_invoicePaidAmount: summary.collectedCash,
          customerReceivable_131: summary.customerReceivable,
          retentionReceivable_1368: summary.retentionReceivable,
          totalContractReceivable: summary.totalContractReceivable,
          reconciliationStatus: summary.reconciliationStatus
        },
        ...invoices.map(invoice => ({
          source: "INVOICE",
          issuedDate: invoice.issuedDate.toISOString(),
          invoiceNumber: invoice.invoiceNumber || invoice.id,
          wbs: `${invoice.wbs.code} ${invoice.wbs.name}`,
          amount: Number(invoice.amount),
          paidAmount: Number(invoice.paidAmount),
          remainingAmount: Number(invoice.remainingAmount),
          retentionAmount: Number(invoice.retentionAmount),
          vatAmount: Number(invoice.vatAmount),
          status: invoice.status,
          approvalStatus: invoice.approvalStatus,
          reconciliationStatus: summary.reconciliationStatus
        }))
      ];
    }
    case "DEBT_RECEIVABLE": {
      const summary = await FinancialAggregationService.getCanonicalProjectFinancials(projectId);
      return [{
        customerReceivable_131: summary.customerReceivable,
        retentionReceivable_1368: summary.retentionReceivable,
        totalContractReceivable: summary.totalContractReceivable,
        invoiceRemaining_operational: summary.totalRemainingInvoice,
        reconciliationVariance: summary.reconciliation.receivableVariance,
        reconciliationStatus: summary.reconciliationStatus
      }];
    }
    case "DEBT_PAYABLE": {
      const summary = await FinancialAggregationService.getCanonicalProjectFinancials(projectId);
      return [{
        vendorPayable_331: summary.vendorPayable,
        vendorPaid_vendorPayments: summary.vendorPaid,
        incurredCost_costRecords: summary.incurredCost,
        postedCost_621_622_623_627: summary.postedCost,
        reconciliationVariance: summary.reconciliation.payableVariance,
        reconciliationStatus: summary.reconciliationStatus
      }];
    }
    case "COSTS": {
      const costs = await prisma.costRecord.findMany({
        where: { projectId, deletedAt: null },
        include: { wbs: { select: { code: true, name: true } }, vendorPayments: true },
        orderBy: { date: "desc" }
      });
      return costs.map(cost => ({
        id: cost.id,
        date: cost.date.toISOString(),
        wbs: `${cost.wbs.code || ""} ${cost.wbs.name}`,
        costType: cost.costType,
        supplier: cost.supplier || "",
        amount: Number(cost.amount),
        netAmount: Number(cost.netAmount || 0),
        vatAmount: Number(cost.vatAmount || 0),
        status: cost.status,
        approvalStatus: cost.approvalStatus,
        workflowStatus: cost.workflowStatus,
        paidByVendorPayment: cost.vendorPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      }));
    }
    case "BUDGET": {
      const budgets = await prisma.budgetRecord.findMany({
        where: { projectId, deletedAt: null },
        include: { wbs: { select: { code: true, name: true } } },
        orderBy: { createdAt: "desc" }
      });
      return budgets.map(budget => ({
        id: budget.id,
        wbs: `${budget.wbs.code || ""} ${budget.wbs.name}`,
        costType: budget.costType,
        estimatedAmount: Number(budget.estimatedAmount),
        createdAt: budget.createdAt.toISOString()
      }));
    }
    case "REVENUE_OPERATIONAL": {
      const revenues = await prisma.revenue.findMany({
        where: { projectId, deletedAt: null },
        include: { wbs: { select: { code: true, name: true } }, invoice: true },
        orderBy: { date: "desc" }
      });
      return revenues.map(revenue => ({
        id: revenue.id,
        date: revenue.date.toISOString(),
        wbs: `${revenue.wbs.code || ""} ${revenue.wbs.name}`,
        invoiceId: revenue.invoiceId || "",
        invoiceNumber: revenue.invoice?.invoiceNumber || "",
        amount: Number(revenue.amount),
        status: revenue.status,
        note: "Operational/legacy revenue; official revenue comes from posted ledger."
      }));
    }
    case "CASH_AGING":
      return (await ReportingService.getProjectMonthlyReport(projectId)) as unknown as Record<string, unknown>[];
    case "TRIAL_BALANCE":
    case "BALANCE_SHEET":
    case "VAT_SUMMARY": {
      const accounts = await prisma.ledgerAccount.findMany({ orderBy: { code: "asc" } });
      const lineAggregations = await prisma.transactionLine.groupBy({
        by: ["accountId", "type"],
        where: { journalEntry: { projectId, deletedAt: null, isPosted: true, isReversed: false }, deletedAt: null },
        _sum: { amount: true }
      });
      const trialBalance = accounts.map(account => {
        const debitAgg = lineAggregations.find(item => item.accountId === account.id && item.type === "DEBIT");
        const creditAgg = lineAggregations.find(item => item.accountId === account.id && item.type === "CREDIT");
        const debitSum = safeDecimal(debitAgg?._sum.amount || 0);
        const creditSum = safeDecimal(creditAgg?._sum.amount || 0);
        const isNormalDebit = account.type === "ASSET" || account.type === "EXPENSE";
        const balance = isNormalDebit ? debitSum.sub(creditSum) : creditSum.sub(debitSum);
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debitSum: debitSum.toNumber(),
          creditSum: creditSum.toNumber(),
          balance: balance.toNumber()
        };
      });

      if (reportType === "TRIAL_BALANCE") return trialBalance;
      if (reportType === "VAT_SUMMARY") {
        const costsWithVat = await prisma.costRecord.findMany({
          where: {
            projectId,
            deletedAt: null,
            vatAmount: { gt: 0 },
            approvalStatus: ApprovalStatus.APPROVED,
            workflowStatus: { in: ["APPROVED", "POSTED"] }
          },
          select: { id: true, date: true, supplier: true, note: true, netAmount: true, vatRate: true, vatAmount: true, amount: true },
          orderBy: { date: "desc" }
        });
        return costsWithVat.map(cost => ({
          id: cost.id,
          date: cost.date.toISOString(),
          supplier: cost.supplier || "Nha cung cap vang lai",
          note: cost.note || "",
          netAmount: Number(cost.netAmount || cost.amount),
          vatRate: Number(cost.vatRate || 0),
          vatAmount: Number(cost.vatAmount || 0),
          amount: Number(cost.amount)
        }));
      }

      const bs = {
        assets: trialBalance.filter(row => row.type === "ASSET"),
        liabilities: trialBalance.filter(row => row.type === "LIABILITY"),
        equity: trialBalance.filter(row => row.type === "EQUITY")
      };
      return [
        ...(bs.assets || []).map((row: Record<string, unknown>) => ({ ...row, section: "ASSET" })),
        ...(bs.liabilities || []).map((row: Record<string, unknown>) => ({ ...row, section: "LIABILITY" })),
        ...(bs.equity || []).map((row: Record<string, unknown>) => ({ ...row, section: "EQUITY" }))
      ];
    }
    case "ADVANCE_PAYMENT_SUMMARY":
      return buildAdvancePaymentSummary(projectId);
    case "DEBT_AR_AP_SUMMARY":
      return buildDebtArApSummary(projectId);
    case "COST_BY_PROJECT_WBS":
      return buildCostByProjectWbs(projectId);
    case "BUDGET_VS_ACTUAL":
      return buildBudgetVsActual(projectId);
    default:
      throw new ApiError(400, `Loại báo cáo xuất khẩu không được hỗ trợ: ${reportType}`);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");
    const body = await request.json();
    const reportType = String(body.reportType || "");
    const projectId = String(body.projectId || "");
    const reason = body.reason ? String(body.reason) : undefined;
    const filters = body.filters && typeof body.filters === "object" ? body.filters : { projectId };

    if (!reportType || !projectId) {
      throw new ApiError(400, "Thiếu tham số bắt buộc: reportType, projectId");
    }

    await requireProjectAccess(user, projectId);
    await auditExportOrThrow({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType,
      format: "csv",
      reason,
      filters
    });

    const rows = await buildRows(reportType, projectId);
    const filename = `${reportType}_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`;
    return csvResponse(filename, rows, {
      title: `Báo cáo ${reportType}`,
      filters,
      csvFallback: true
    });
  } catch (error) {
    return handleApiError(error);
  }
}
