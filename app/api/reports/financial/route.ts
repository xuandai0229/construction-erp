import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn Dự án" }, { status: 400 });
    }

    // 1. Fetch all ledger accounts and transaction lines for the project
    const [accounts, journalEntries] = await Promise.all([
      prisma.ledgerAccount.findMany({ orderBy: { code: "asc" } }),
      prisma.journalEntry.findMany({
        where: { projectId, deletedAt: null },
        include: { lines: true }
      })
    ]);

    // Gather transaction lines
    const allLines = journalEntries.flatMap(entry => entry.lines);

    // 2. TRIAL BALANCE CALCULATION
    const trialBalance = accounts.map(acc => {
      const accLines = allLines.filter(line => line.accountId === acc.id);
      
      const debitSum = accLines
        .filter(l => l.type === "DEBIT")
        .reduce((s, l) => s.add(safeDecimal(l.amount)), safeDecimal(0));
        
      const creditSum = accLines
        .filter(l => l.type === "CREDIT")
        .reduce((s, l) => s.add(safeDecimal(l.amount)), safeDecimal(0));

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

    // 4. VAT SUMMARY REPORT
    const costsWithVat = await prisma.costRecord.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { date: "desc" }
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
        vatSummary
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
