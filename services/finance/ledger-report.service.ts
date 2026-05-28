import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";

export class LedgerReportService {
  /**
   * Lập báo cáo Sổ Cái chi tiết cho một tài khoản trong khoảng thời gian cụ thể.
   * Tính toán đầy đủ Dư đầu kỳ dồn tích, phát sinh chi tiết trong kỳ, tổng phát sinh Nợ/Có, và Dư cuối kỳ.
   */
  static async getReport(
    projectId: string,
    accountCode: string,
    startDate?: Date | string,
    endDate?: Date | string
  ) {
    const sDate = startDate ? new Date(startDate) : new Date("1970-01-01");
    const eDate = endDate ? new Date(endDate) : new Date("2100-01-01");

    // 1. Tìm thông tin tài khoản
    const account = await prisma.ledgerAccount.findFirst({
      where: { code: accountCode, isActive: true, deletedAt: null }
    });
    if (!account) {
      throw new Error(`Tài khoản '${accountCode}' không tồn tại hoặc đã ngừng hoạt động.`);
    }

    // 2. Tính số dư đầu kỳ (Lũy kế phát sinh trước ngày bắt đầu)
    const [preDebitAgg, preCreditAgg] = await Promise.all([
      prisma.transactionLine.aggregate({
        where: {
          accountId: account.id,
          type: "DEBIT",
          ...getPostedLedgerLineFilter({ projectId, endDate: new Date(sDate.getTime() - 1) })
        },
        _sum: { amount: true }
      }),
      prisma.transactionLine.aggregate({
        where: {
          accountId: account.id,
          type: "CREDIT",
          ...getPostedLedgerLineFilter({ projectId, endDate: new Date(sDate.getTime() - 1) })
        },
        _sum: { amount: true }
      })
    ]);

    const preDebit = safeDecimal(preDebitAgg._sum?.amount || 0);
    const preCredit = safeDecimal(preCreditAgg._sum?.amount || 0);
    const isNormalDebit = account.type === "ASSET" || account.type === "EXPENSE";

    // Phân loại số dư đầu kỳ
    let openingDebit = safeDecimal(0);
    let openingCredit = safeDecimal(0);

    if (isNormalDebit) {
      const net = preDebit.sub(preCredit);
      if (net.gt(0)) openingDebit = net;
      else if (net.lt(0)) openingCredit = net.abs();
    } else {
      const net = preCredit.sub(preDebit);
      if (net.gt(0)) openingCredit = net;
      else if (net.lt(0)) openingDebit = net.abs();
    }

    // 3. Lấy phát sinh chi tiết trong kỳ
    const lines = await prisma.transactionLine.findMany({
      where: {
        accountId: account.id,
        ...getPostedLedgerLineFilter({ projectId, startDate: sDate, endDate: eDate })
      },
      include: {
        journalEntry: true
      },
      orderBy: { journalEntry: { date: "asc" } }
    });

    let periodDebitSum = safeDecimal(0);
    let periodCreditSum = safeDecimal(0);

    const periodLines = lines.map(line => {
      const amt = safeDecimal(line.amount);
      if (line.type === "DEBIT") {
        periodDebitSum = periodDebitSum.add(amt);
      } else {
        periodCreditSum = periodCreditSum.add(amt);
      }

      return {
        id: line.id,
        date: line.journalEntry.date,
        reference: line.journalEntry.reference,
        description: line.description || line.journalEntry.description,
        debit: line.type === "DEBIT" ? amt.toNumber() : 0,
        credit: line.type === "CREDIT" ? amt.toNumber() : 0
      };
    });

    // 4. Tính số dư cuối kỳ (Dư đầu kỳ + Phát sinh trong kỳ)
    let closingDebit = safeDecimal(0);
    let closingCredit = safeDecimal(0);

    const totalDebit = preDebit.add(periodDebitSum);
    const totalCredit = preCredit.add(periodCreditSum);

    if (isNormalDebit) {
      const net = totalDebit.sub(totalCredit);
      if (net.gt(0)) closingDebit = net;
      else if (net.lt(0)) closingCredit = net.abs();
    } else {
      const net = totalCredit.sub(totalDebit);
      if (net.gt(0)) closingCredit = net;
      else if (net.lt(0)) closingDebit = net.abs();
    }

    return {
      account: {
        code: account.code,
        name: account.name,
        type: account.type
      },
      opening: {
        debit: openingDebit.toNumber(),
        credit: openingCredit.toNumber()
      },
      lines: periodLines,
      totals: {
        debit: periodDebitSum.toNumber(),
        credit: periodCreditSum.toNumber()
      },
      closing: {
        debit: closingDebit.toNumber(),
        credit: closingCredit.toNumber()
      }
    };
  }
}
