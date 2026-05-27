import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/api-error";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";
import { ReportingService } from "@/services/reporting.service";
import { auditExportOrThrow, requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { safeDecimal } from "@/lib/math";

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

function csvResponse(filename: string, rows: Record<string, unknown>[]) {
  return new NextResponse(`\uFEFF${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
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
          where: { projectId, deletedAt: null, vatAmount: { gt: 0 } },
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
    default:
      throw new ApiError(400, `Unsupported export reportType: ${reportType}`);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");
    const body = await request.json();
    const reportType = String(body.reportType || "");
    const projectId = String(body.projectId || "");
    const reason = body.reason ? String(body.reason) : undefined;

    if (!reportType || !projectId) {
      throw new ApiError(400, "Missing required parameters: reportType, projectId");
    }

    await requireProjectAccess(user, projectId);
    await auditExportOrThrow({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType,
      format: "csv",
      reason
    });

    const rows = await buildRows(reportType, projectId);
    const filename = `${reportType}_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`;
    return csvResponse(filename, rows);
  } catch (error) {
    return handleApiError(error);
  }
}
