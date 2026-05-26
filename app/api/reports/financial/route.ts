import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn Dự án" }, { status: 400 });
    }

    // Tenant Isolation
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    await requireProjectAccess(user, projectId);

    // 1. Fetch ledger accounts
    const accounts = await prisma.ledgerAccount.findMany({ orderBy: { code: "asc" } });

    // 2. TRIAL BALANCE CALCULATION (DB Aggregation - OOM Safe)
    const lineAggregations = await prisma.transactionLine.groupBy({
      by: ['accountId', 'type'],
      where: {
        journalEntry: {
          projectId,
          deletedAt: null
        }
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
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debitSum: debitSum.toNumber(),
        creditSum: creditSum.toNumber(),
        balance: balance.toNumber()
      };
    });

    // 3. BALANCE SHEET CALCULATION
    const assets = trialBalance.filter(row => row.type === "ASSET");
    const liabilities = trialBalance.filter(row => row.type === "LIABILITY");
    const equity = trialBalance.filter(row => row.type === "EQUITY");

    // Add retained profit from income/expense matching to equity (Batch 6.3)
    const incomeSum = trialBalance
      .filter(row => row.type === "INCOME")
      .reduce((s, r) => s.add(safeDecimal(r.balance)), safeDecimal(0));

    const expenseSum = trialBalance
      .filter(row => row.type === "EXPENSE")
      .reduce((s, r) => s.add(safeDecimal(r.balance)), safeDecimal(0));

    const retainedProfit = incomeSum.sub(expenseSum).toNumber();
    equity.push({
      id: "retained_profit",
      code: "3330-RE",
      name: "Lợi nhuận sau thuế chưa phân phối (Lũy kế)",
      type: "EQUITY",
      debitSum: 0,
      creditSum: retainedProfit >= 0 ? retainedProfit : 0,
      balance: retainedProfit
    });

    // 4. VAT SUMMARY REPORT (Pagination Enabled)
    const costsWithVat = await prisma.costRecord.findMany({
      where: { projectId, deletedAt: null, vatAmount: { gt: 0 } },
      select: {
        id: true,
        date: true,
        supplier: true,
        note: true,
        netAmount: true,
        vatRate: true,
        vatAmount: true,
        amount: true
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: skip
    });

    const vatSummary = costsWithVat.map(c => ({
      id: c.id,
      date: c.date,
      supplier: c.supplier || "Nhà cung cấp vãng lai",
      note: c.note || "Chi phí không có ghi chú",
      netAmount: Number(c.netAmount || c.amount),
      vatRate: c.vatRate || 0,
      vatAmount: Number(c.vatAmount || 0),
      amount: Number(c.amount)
    }));

    return NextResponse.json({
      success: true,
      data: {
        trialBalance,
        balanceSheet: {
          assets,
          liabilities,
          equity
        },
        vatSummary,
        pagination: { page, limit }
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
