import { handleApiError, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";
import { generateCsvResponse } from "@/lib/export/accountingExport";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new ApiError(400, "ProjectId is required");
    }

    await requireProjectAccess(user, projectId);

    const accounts = await prisma.ledgerAccount.findMany({ orderBy: { code: "asc" } });

    const lineAggregations = await prisma.transactionLine.groupBy({
      by: ['accountId', 'type'],
      where: {
        ...getPostedLedgerLineFilter({ projectId })
      },
      _sum: { amount: true }
    });

    const trialBalance = accounts.map(acc => {
      const debitAgg = lineAggregations.find(a => a.accountId === acc.id && a.type === "DEBIT");
      const creditAgg = lineAggregations.find(a => a.accountId === acc.id && a.type === "CREDIT");
      
      const debitSum = safeDecimal(debitAgg?._sum.amount || 0);
      const creditSum = safeDecimal(creditAgg?._sum.amount || 0);

      const isNormalDebit = acc.type === "ASSET" || acc.type === "EXPENSE";
      const balance = isNormalDebit ? debitSum.sub(creditSum) : creditSum.sub(debitSum);

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debitSum: debitSum.toNumber(),
        creditSum: creditSum.toNumber(),
        balance: balance.toNumber()
      };
    });

    const headers = [
      "Ma TK",
      "Ten Tai Khoan",
      "Loai TK",
      "Phat sinh No (Debit Sum)",
      "Phat sinh Co (Credit Sum)",
      "Du cuoi ky (Balance)"
    ];

    const rows = trialBalance.map(row => [
      row.code,
      row.name,
      row.type,
      String(row.debitSum),
      String(row.creditSum),
      String(row.balance)
    ]);

    const project = await prisma.project.findFirst({ where: { id: projectId } });
    const filename = `BangCanDoiPhatSinh_${project?.name || "DuAn"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType: "TRIAL_BALANCE_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat bang can doi phat sinh tai khoan cho du an ${project?.name}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
