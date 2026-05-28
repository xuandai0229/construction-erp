import { prisma } from "@/lib/prisma";

export class GeneralJournalService {
  /**
   * Truy xuất Sổ Nhật ký chung chuẩn kế toán cho dự án.
   * Lấy trực tiếp từ các bút toán hạch toán kép đã được ghi sổ (isPosted: true).
   */
  static async getReport(
    projectId: string,
    startDate?: Date | string,
    endDate?: Date | string
  ) {
    const whereCondition: any = {
      journalEntry: {
        projectId,
        deletedAt: null,
        isPosted: true
      },
      deletedAt: null
    };

    if (startDate || endDate) {
      whereCondition.journalEntry.date = {};
      if (startDate) {
        whereCondition.journalEntry.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.journalEntry.date.lte = new Date(endDate);
      }
    }

    const lines = await prisma.transactionLine.findMany({
      where: whereCondition,
      include: {
        account: true,
        journalEntry: true
      },
      orderBy: [
        { journalEntry: { date: "asc" } },
        { journalEntry: { reference: "asc" } },
        { type: "desc" } // DEBIT hiển thị trước CREDIT
      ]
    });

    return lines.map(line => ({
      id: line.id,
      date: line.journalEntry.date,
      reference: line.journalEntry.reference,
      description: line.description || line.journalEntry.description,
      debitAccount: line.type === "DEBIT" ? line.account.code : null,
      creditAccount: line.type === "CREDIT" ? line.account.code : null,
      amount: Number(line.amount)
    }));
  }
}
