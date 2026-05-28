import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";

export class TrialBalanceService {
  /**
   * Lập Bảng cân đối phát sinh (Trial Balance) chuẩn mực kế toán cho dự án.
   * Tính toán Số dư đầu kỳ, Phát sinh trong kỳ, và Số dư cuối kỳ của từng tài khoản.
   * Thực hiện đối chiếu tự động đảm bảo Tổng Nợ = Tổng Có.
   */
  static async getReport(
    projectId: string,
    startDate?: Date | string,
    endDate?: Date | string
  ) {
    const sDate = startDate ? new Date(startDate) : new Date("1970-01-01");
    const eDate = endDate ? new Date(endDate) : new Date("2100-01-01");

    // 1. Lấy tất cả tài khoản
    const accounts = await prisma.ledgerAccount.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { code: "asc" }
    });

    // 2. Tính số dư đầu kỳ (Lũy kế phát sinh trước sDate)
    const [preDebitLines, preCreditLines] = await Promise.all([
      prisma.transactionLine.groupBy({
        by: ["accountId"],
        where: {
          type: "DEBIT",
          ...getPostedLedgerLineFilter({ projectId, endDate: new Date(sDate.getTime() - 1) })
        },
        _sum: { amount: true }
      }),
      prisma.transactionLine.groupBy({
        by: ["accountId"],
        where: {
          type: "CREDIT",
          ...getPostedLedgerLineFilter({ projectId, endDate: new Date(sDate.getTime() - 1) })
        },
        _sum: { amount: true }
      })
    ]);

    // 3. Tính phát sinh trong kỳ (Từ sDate đến eDate)
    const [periodDebitLines, periodCreditLines] = await Promise.all([
      prisma.transactionLine.groupBy({
        by: ["accountId"],
        where: {
          type: "DEBIT",
          ...getPostedLedgerLineFilter({ projectId, startDate: sDate, endDate: eDate })
        },
        _sum: { amount: true }
      }),
      prisma.transactionLine.groupBy({
        by: ["accountId"],
        where: {
          type: "CREDIT",
          ...getPostedLedgerLineFilter({ projectId, startDate: sDate, endDate: eDate })
        },
        _sum: { amount: true }
      })
    ]);

    let totalOpeningDebit = safeDecimal(0);
    let totalOpeningCredit = safeDecimal(0);
    let totalPeriodDebit = safeDecimal(0);
    let totalPeriodCredit = safeDecimal(0);
    let totalClosingDebit = safeDecimal(0);
    let totalClosingCredit = safeDecimal(0);

    const rows = accounts.map(acc => {
      const isNormalDebit = acc.type === "ASSET" || acc.type === "EXPENSE";

      // Đầu kỳ
      const preDebSum = safeDecimal(preDebitLines.find(x => x.accountId === acc.id)?._sum.amount || 0);
      const preCredSum = safeDecimal(preCreditLines.find(x => x.accountId === acc.id)?._sum.amount || 0);
      
      let openingDebit = safeDecimal(0);
      let openingCredit = safeDecimal(0);

      if (isNormalDebit) {
        const net = preDebSum.sub(preCredSum);
        if (net.gt(0)) openingDebit = net;
        else if (net.lt(0)) openingCredit = net.abs();
      } else {
        const net = preCredSum.sub(preDebSum);
        if (net.gt(0)) openingCredit = net;
        else if (net.lt(0)) openingDebit = net.abs();
      }

      // Phát sinh trong kỳ
      const periodDebSum = safeDecimal(periodDebitLines.find(x => x.accountId === acc.id)?._sum.amount || 0);
      const periodCredSum = safeDecimal(periodCreditLines.find(x => x.accountId === acc.id)?._sum.amount || 0);

      // Cuối kỳ (Tính dựa trên lũy kế tổng Nợ/Có)
      const cumDeb = preDebSum.add(periodDebSum);
      const cumCred = preCredSum.add(periodCredSum);

      let closingDebit = safeDecimal(0);
      let closingCredit = safeDecimal(0);

      if (isNormalDebit) {
        const net = cumDeb.sub(cumCred);
        if (net.gt(0)) closingDebit = net;
        else if (net.lt(0)) closingCredit = net.abs();
      } else {
        const net = cumCred.sub(cumDeb);
        if (net.gt(0)) closingCredit = net;
        else if (net.lt(0)) closingDebit = net.abs();
      }

      // Cộng dồn tổng báo cáo
      totalOpeningDebit = totalOpeningDebit.add(openingDebit);
      totalOpeningCredit = totalOpeningCredit.add(openingCredit);
      totalPeriodDebit = totalPeriodDebit.add(periodDebSum);
      totalPeriodCredit = totalPeriodCredit.add(periodCredSum);
      totalClosingDebit = totalClosingDebit.add(closingDebit);
      totalClosingCredit = totalClosingCredit.add(closingCredit);

      return {
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        opening: {
          debit: openingDebit.toNumber(),
          credit: openingCredit.toNumber()
        },
        period: {
          debit: periodDebSum.toNumber(),
          credit: periodCredSum.toNumber()
        },
        closing: {
          debit: closingDebit.toNumber(),
          credit: closingCredit.toNumber()
        }
      };
    }).filter(row => {
      // Chỉ hiển thị các tài khoản hoạt động
      return (
        row.opening.debit > 0 ||
        row.opening.credit > 0 ||
        row.period.debit > 0 ||
        row.period.credit > 0 ||
        row.closing.debit > 0 ||
        row.closing.credit > 0
      );
    });

    // Đối chiếu nguyên tắc cân đối lưỡng diện
    // 1. Tổng phát sinh Nợ phải bằng Tổng phát sinh Có trong kỳ
    if (!totalPeriodDebit.equals(totalPeriodCredit)) {
      throw new Error(
        `Mất cân đối phát sinh trong kỳ: Tổng Nợ (${totalPeriodDebit.toString()}) != Tổng Có (${totalPeriodCredit.toString()})`
      );
    }
    // 2. Tổng số dư cuối kỳ Nợ phải bằng Tổng số dư cuối kỳ Có
    if (!totalClosingDebit.equals(totalClosingCredit)) {
      throw new Error(
        `Mất cân đối số dư cuối kỳ: Tổng Nợ (${totalClosingDebit.toString()}) != Tổng Có (${totalClosingCredit.toString()})`
      );
    }

    return {
      rows,
      totals: {
        opening: {
          debit: totalOpeningDebit.toNumber(),
          credit: totalOpeningCredit.toNumber()
        },
        period: {
          debit: totalPeriodDebit.toNumber(),
          credit: totalPeriodCredit.toNumber()
        },
        closing: {
          debit: totalClosingDebit.toNumber(),
          credit: totalClosingCredit.toNumber()
        }
      }
    };
  }
}
