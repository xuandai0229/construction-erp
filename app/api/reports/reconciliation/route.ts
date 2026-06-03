import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (!projectId) {
      throw new ApiError(400, "Cần chọn dự án để chạy đối soát.");
    }

    await requireProjectAccess(user, projectId);

    const [opInvoiceSum, ledgerArDebit, ledgerArCredit] = await Promise.all([
      prisma.invoice.aggregate({
        where: { projectId, deletedAt: null, approvalStatus: { not: "CANCELLED" } },
        _sum: { remainingAmount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "131" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "DEBIT" },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "131" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "CREDIT" },
        _sum: { amount: true }
      })
    ]);

    const opArTotal = Number(opInvoiceSum._sum?.remainingAmount || 0);
    const ledgerArTotal = Number(ledgerArDebit._sum?.amount || 0) - Number(ledgerArCredit._sum?.amount || 0);
    const arDrift = Math.abs(opArTotal - ledgerArTotal);

    const [opCostSum, ledgerApCredit, ledgerApDebit] = await Promise.all([
      prisma.costRecord.aggregate({
        where: { projectId, deletedAt: null, status: "unpaid", approvalStatus: { not: "CANCELLED" } },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "331" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "CREDIT" },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "331" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "DEBIT" },
        _sum: { amount: true }
      })
    ]);

    const opApTotal = Number(opCostSum._sum?.amount || 0);
    const ledgerApTotal = Number(ledgerApCredit._sum?.amount || 0) - Number(ledgerApDebit._sum?.amount || 0);
    const apDrift = Math.abs(opApTotal - ledgerApTotal);

    const [opRevenueSum, ledgerRevenueCredit, ledgerRevenueDebit] = await Promise.all([
      prisma.invoice.aggregate({
        where: { projectId, deletedAt: null, approvalStatus: { not: "CANCELLED" } },
        _sum: { netAmount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "511" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "CREDIT" },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "511" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "DEBIT" },
        _sum: { amount: true }
      })
    ]);

    const opRevenueTotal = Number(opRevenueSum._sum?.netAmount || 0);
    const ledgerRevenueTotal = Number(ledgerRevenueCredit._sum?.amount || 0) - Number(ledgerRevenueDebit._sum?.amount || 0);
    const revenueDrift = Math.abs(opRevenueTotal - ledgerRevenueTotal);

    const [opExpenseSum, ledgerCostDebit, ledgerCostCredit] = await Promise.all([
      prisma.costRecord.aggregate({
        where: { projectId, deletedAt: null, approvalStatus: { not: "CANCELLED" } },
        _sum: { netAmount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "62" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "DEBIT" },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: { account: { code: { startsWith: "62" } }, journalEntry: { projectId, deletedAt: null }, deletedAt: null, type: "CREDIT" },
        _sum: { amount: true }
      })
    ]);

    const opCostTotal = Number(opExpenseSum._sum?.netAmount || 0);
    const ledgerCostTotal = Number(ledgerCostDebit._sum?.amount || 0) - Number(ledgerCostCredit._sum?.amount || 0);
    const costDrift = Math.abs(opCostTotal - ledgerCostTotal);

    const healthy = arDrift < 1.0 && apDrift < 1.0 && revenueDrift < 1.0 && costDrift < 1.0;
    const warnings: string[] = [];
    const drifts = [];

    if (arDrift >= 1.0) {
      warnings.push(`Chênh lệch công nợ phải thu: ${arDrift.toLocaleString("vi-VN")} đ`);
      drifts.push({ type: "AR", drift: arDrift });
    }
    if (apDrift >= 1.0) {
      warnings.push(`Chênh lệch công nợ phải trả: ${apDrift.toLocaleString("vi-VN")} đ`);
      drifts.push({ type: "AP", drift: apDrift });
    }
    if (revenueDrift >= 1.0) {
      warnings.push(`Chênh lệch doanh thu: ${revenueDrift.toLocaleString("vi-VN")} đ`);
      drifts.push({ type: "REVENUE", drift: revenueDrift });
    }
    if (costDrift >= 1.0) {
      warnings.push(`Chênh lệch chi phí: ${costDrift.toLocaleString("vi-VN")} đ`);
      drifts.push({ type: "COST", drift: costDrift });
    }

    return successResponse({
      healthy,
      warnings,
      drifts,
      totals: {
        operational: {
          ar: opArTotal,
          ap: opApTotal,
          revenue: opRevenueTotal,
          cost: opCostTotal
        },
        ledger: {
          ar: ledgerArTotal,
          ap: ledgerApTotal,
          revenue: ledgerRevenueTotal,
          cost: ledgerCostTotal
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
