import { prisma } from "@/lib/prisma";
import { safeDecimal } from "@/lib/math";
import { VoucherService } from "../voucher.service";

export class WorkInProgressClosingService {
  /**
   * Tính toán xem trước (Preview) chi phí dở dang đầu 6 (621, 622, 623, 627) cần kết chuyển sang 154.
   */
  static async previewClosing(
    projectId: string,
    startDate: Date | string,
    endDate: Date | string
  ) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    // Tìm tài khoản 154 và các tài khoản chi phí 621, 622, 623, 627
    const accountCodes = ["154", "621", "622", "623", "627"];
    const accounts = await prisma.ledgerAccount.findMany({
      where: { code: { in: accountCodes }, isActive: true, deletedAt: null }
    });

    const acct154 = accounts.find(a => a.code === "154");
    if (!acct154) {
      throw new Error("Không tìm thấy tài khoản 154 (Chi phí SXKD dở dang) trong hệ thống.");
    }

    const previewRows: any[] = [];
    let totalClosingAmt = safeDecimal(0);

    const costCodes = ["621", "622", "623", "627"];
    for (const code of costCodes) {
      const acct = accounts.find(a => a.code === code);
      if (!acct) continue;

      // Lấy tổng phát sinh Nợ trừ đi tổng phát sinh Có của tài khoản chi phí trong kỳ
      const [debAgg, credAgg] = await Promise.all([
        prisma.transactionLine.aggregate({
          where: {
            accountId: acct.id,
            type: "DEBIT",
            journalEntry: {
              projectId,
              isPosted: true,
              deletedAt: null,
              date: { gte: sDate, lte: eDate }
            },
            deletedAt: null
          },
          _sum: { amount: true }
        }),
        prisma.transactionLine.aggregate({
          where: {
            accountId: acct.id,
            type: "CREDIT",
            journalEntry: {
              projectId,
              isPosted: true,
              deletedAt: null,
              date: { gte: sDate, lte: eDate }
            },
            deletedAt: null
          },
          _sum: { amount: true }
        })
      ]);

      const debSum = safeDecimal(debAgg._sum?.amount || 0);
      const credSum = safeDecimal(credAgg._sum?.amount || 0);
      const balance = debSum.sub(credSum); // Số dư chi phí cần kết chuyển

      if (balance.gt(0)) {
        previewRows.push({
          accountId: acct.id,
          code: acct.code,
          name: acct.name,
          amount: balance.toNumber()
        });
        totalClosingAmt = totalClosingAmt.add(balance);
      }
    }

    return {
      projectId,
      startDate: sDate,
      endDate: eDate,
      account154: {
        id: acct154.id,
        code: acct154.code,
        name: acct154.name
      },
      lines: previewRows,
      totalAmount: totalClosingAmt.toNumber()
    };
  }

  /**
   * Thực thi (Execute) lập chứng từ kết chuyển chi phí dở dang tự động sang TK 154.
   */
  static async executeClosing(
    userId: string,
    projectId: string,
    startDate: Date | string,
    endDate: Date | string
  ) {
    const preview = await this.previewClosing(projectId, startDate, endDate);

    if (preview.totalAmount <= 0) {
      throw new Error("Không có chi phí đầu 6 nào phát sinh trong kỳ cần kết chuyển.");
    }

    const monthStr = new Date(endDate).toISOString().slice(0, 7); // YYYY-MM

    // Lập danh sách dòng định khoản
    const lines: any[] = [];

    // Ghi Nợ TK 1540
    lines.push({
      accountId: preview.account154.id,
      amount: preview.totalAmount,
      type: "DEBIT",
      description: `Kết chuyển tổng chi phí SXKD dở dang công trình kỳ ${monthStr}`
    });

    // Ghi Có các TK chi phí đầu 6
    for (const line of preview.lines) {
      lines.push({
        accountId: line.accountId,
        amount: line.amount,
        type: "CREDIT",
        description: `Kết chuyển chi phí tài khoản ${line.code} kỳ ${monthStr}`
      });
    }

    // Thực thi lập chứng từ qua VoucherService (ở trạng thái DA_CAT nháp để kế toán duyệt/ghi sổ)
    const voucher = await VoucherService.saveVoucher(userId, {
      projectId,
      date: new Date(endDate),
      description: `Bút toán tự động kết chuyển chi phí dở dang công trình kỳ ${monthStr} sang TK 154`,
      sourceType: "WIP_CLOSING",
      sourceId: `WIP-${monthStr}-${projectId.substring(0, 8)}`,
      status: "DA_CAT",
      lines
    });

    if (!voucher) {
      throw new Error("Không thể khởi tạo chứng từ kết chuyển chi phí dở dang WIP.");
    }

    return {
      success: true,
      voucherId: voucher.id,
      reference: voucher.reference || "",
      totalAmount: preview.totalAmount,
      message: `Đã lập thành công chứng từ kết chuyển chi phí dở dang tự động ${voucher.reference || ""} với tổng số tiền ${preview.totalAmount.toLocaleString()} VND.`
    };
  }
}
