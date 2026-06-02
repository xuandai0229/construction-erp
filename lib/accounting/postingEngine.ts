import { TransactionType, CostType } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

/**
 * Posting Engine sinh bút toán kép cho các nghiệp vụ tài chính.
 * Ngày khóa kỳ luôn lấy theo ngày chứng từ/ngày hạch toán, không lấy ngày hiện tại.
 */
export class PostingEngine {
  static async postCost(tx: any, params: {
    costId: string;
    projectId: string;
    amount: number;
    costType: CostType;
    description: string;
    purchaseOrderId?: string;
  }) {
    const expenseCode = this.getExpenseCode(params.costType);
    const apCode = "3310";
    const grniCode = "3311";
    const debitAccount = params.purchaseOrderId ? grniCode : expenseCode;

    const cost = await tx.costRecord.findUnique({
      where: { id: params.costId }
    });

    if (!cost) throw new ApiError(404, `Không tìm thấy chi phí để hạch toán: ${params.costId}`);

    const vatAmount = Number(cost.vatAmount || 0);
    const grossAmount = Number(cost.amount || params.amount);
    const netAmount = grossAmount - vatAmount;

    const lines = [];
    if (netAmount > 0) {
      lines.push({ accountCode: debitAccount, amount: netAmount, type: TransactionType.DEBIT });
    }
    if (vatAmount > 0) {
      lines.push({ accountCode: "1331", amount: vatAmount, type: TransactionType.DEBIT });
    }
    lines.push({ accountCode: apCode, amount: grossAmount, type: TransactionType.CREDIT });

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Ghi nhận chi phí: ${params.description}`,
      reference: `COST-${params.costId}`,
      sourceType: "COST",
      sourceId: params.costId,
      accountingDate: cost.date,
      lines
    });
  }

  static async postGoodsReceipt(tx: any, params: {
    receiptId: string;
    projectId: string;
    amount: number;
    costType: CostType;
    description: string;
    accountingDate: Date | string;
  }) {
    const expenseCode = this.getExpenseCode(params.costType);
    const grniCode = "3311";

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Nhập kho / Nhận hàng: ${params.description}`,
      reference: `GRN-${params.receiptId}`,
      sourceType: "GRN",
      sourceId: params.receiptId,
      accountingDate: params.accountingDate,
      lines: [
        { accountCode: expenseCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: grniCode, amount: params.amount, type: TransactionType.CREDIT },
      ]
    });
  }

  static async postInvoice(tx: any, params: {
    invoiceId: string;
    projectId: string;
    amount: number;
    description: string;
  }) {
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId }
    });

    if (!invoice) throw new ApiError(404, `Không tìm thấy hóa đơn để hạch toán: ${params.invoiceId}`);

    const arCode = "1310";
    const retentionCode = "1368";
    const revenueCode = "5110";
    const vatCode = "33311";
    const netAmount = Number(invoice.netAmount || invoice.amount);
    const vatAmount = Number(invoice.vatAmount || 0);
    const retentionAmount = Number(invoice.retentionAmount || 0);
    const claimAmount = Number(invoice.amount);

    const lines = [];
    if (claimAmount > 0) {
      lines.push({ accountCode: arCode, amount: claimAmount - retentionAmount, type: TransactionType.DEBIT });
    }
    if (retentionAmount > 0) {
      lines.push({ accountCode: retentionCode, amount: retentionAmount, type: TransactionType.DEBIT });
    }
    if (netAmount > 0) {
      lines.push({ accountCode: revenueCode, amount: netAmount, type: TransactionType.CREDIT });
    }
    if (vatAmount > 0) {
      lines.push({ accountCode: vatCode, amount: vatAmount, type: TransactionType.CREDIT });
    }

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Phát hành hóa đơn: ${params.description}`,
      reference: `INV-${params.invoiceId}`,
      sourceType: "INVOICE",
      sourceId: params.invoiceId,
      accountingDate: invoice.issuedDate,
      lines
    });
  }

  static async postPayment(tx: any, params: {
    paymentId: string;
    projectId: string;
    amount: number;
    description: string;
  }) {
    const payment = await tx.payment.findUnique({
      where: { id: params.paymentId }
    });
    if (!payment) throw new ApiError(404, `Không tìm thấy thanh toán để hạch toán: ${params.paymentId}`);

    const cashCode = "1010";
    const arCode = "1310";

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Thu tiền thanh toán: ${params.description}`,
      reference: `PAY-${params.paymentId}`,
      sourceType: "PAYMENT",
      sourceId: params.paymentId,
      accountingDate: payment.date,
      lines: [
        { accountCode: cashCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: arCode, amount: params.amount, type: TransactionType.CREDIT },
      ]
    });
  }

  private static getExpenseCode(type: CostType): string {
    switch (type) {
      case "material": return "6210";
      case "labor": return "6220";
      case "machine": return "6230";
      case "subcontract": return "6270";
      case "overhead": return "6270";
      default: return "6270";
    }
  }

  static async createDoubleEntry(tx: any, params: {
    projectId: string | null;
    description: string;
    reference: string;
    sourceType: string;
    sourceId: string;
    accountingDate: Date | string;
    companyId?: string | null;
    lines: { accountCode: string, amount: number, type: TransactionType }[];
  }) {
    const startTime = Date.now();
    const accountingDate = new Date(params.accountingDate);
    if (Number.isNaN(accountingDate.getTime())) {
      throw new ApiError(400, "Ngày hạch toán của chứng từ không hợp lệ.");
    }

    const projectRequiredSources = new Set(["COST", "INVOICE", "PAYMENT", "ADVANCE", "ADVANCE_SETTLEMENT", "CONTRACT", "GRN"]);
    if (projectRequiredSources.has(params.sourceType) && !params.projectId) {
      throw new ApiError(400, "Không thể ghi sổ chứng từ công trình vì thiếu liên kết công trình.");
    }

    const companyId = params.companyId ?? await this.resolveCompanyId(tx, params.projectId);
    try {
      await this.assertPeriodNotLocked(accountingDate, companyId);
    } catch (error) {
      throw new ApiError(400, "Không thể ghi sổ chứng từ vì kỳ kế toán của ngày chứng từ đã bị khóa.", {
        cause: error instanceof Error ? error.message : String(error),
        accountingDate: accountingDate.toISOString()
      });
    }

    if (params.sourceId && params.sourceType) {
      const activeEntry = await tx.journalEntry.findFirst({
        where: { sourceId: params.sourceId, sourceType: params.sourceType, deletedAt: null }
      });
      if (activeEntry) {
        throw new ApiError(400, `Giao dịch đã được hạch toán vào Sổ cái trước đó (JournalEntry ID: ${activeEntry.id})`);
      }
    }

    const debits = params.lines.filter(l => l.type === TransactionType.DEBIT).reduce((s, l) => s + l.amount, 0);
    const credits = params.lines.filter(l => l.type === TransactionType.CREDIT).reduce((s, l) => s + l.amount, 0);

    if (Math.abs(debits - credits) > 0.01) {
      throw new ApiError(500, `Lỗi kế toán: Nợ (${debits}) không bằng Có (${credits})`);
    }

    const codes = params.lines.map(l => l.accountCode);
    const accounts = await tx.ledgerAccount.findMany({
      where: { code: { in: codes } }
    });
    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));

    const entry = await tx.journalEntry.create({
      data: {
        projectId: params.projectId,
        date: accountingDate,
        description: params.description,
        reference: params.reference,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        isPosted: true,
      }
    });

    for (const line of params.lines) {
      const accountId = accountMap.get(line.accountCode);
      if (!accountId) throw new ApiError(500, `Không tìm thấy tài khoản kế toán: ${line.accountCode}`);

      await tx.transactionLine.create({
        data: {
          journalEntryId: entry.id,
          accountId,
          amount: line.amount,
          type: line.type,
          description: params.description
        }
      });
    }

    const { MetricsCollector } = require("@/lib/metrics");
    MetricsCollector.recordPostingDuration(Date.now() - startTime);
  }

  static async reverseJournal(tx: any, sourceId: string, sourceType: string, userId: string, options: {
    reversalDate?: Date | string;
    companyId?: string | null;
  } = {}) {
    const oldEntry = await tx.journalEntry.findFirst({
      where: { sourceId, sourceType, deletedAt: null },
      include: { lines: true }
    });

    if (!oldEntry) return;
    if (oldEntry.isReversed) throw new ApiError(400, "Giao dịch đã được hủy trước đó.");

    const companyId = options.companyId ?? await this.resolveCompanyId(tx, oldEntry.projectId);
    try {
      await this.assertPeriodNotLocked(oldEntry.date, companyId);
    } catch (error) {
      throw new ApiError(400, "Không thể hủy ghi sổ chứng từ thuộc kỳ đã khóa.", {
        cause: error instanceof Error ? error.message : String(error),
        accountingDate: oldEntry.date
      });
    }

    const reversalDate = options.reversalDate ? new Date(options.reversalDate) : new Date();
    if (Number.isNaN(reversalDate.getTime())) {
      throw new ApiError(400, "Ngày hủy ghi sổ không hợp lệ.");
    }
    try {
      await this.assertPeriodNotLocked(reversalDate, companyId);
    } catch (error) {
      throw new ApiError(400, "Không thể hủy ghi sổ chứng từ vì kỳ kế toán của ngày hủy đã bị khóa.", {
        cause: error instanceof Error ? error.message : String(error),
        reversalDate: reversalDate.toISOString()
      });
    }

    await tx.journalEntry.update({
      where: { id: oldEntry.id },
      data: { isReversed: true, reversedById: userId }
    });

    const newEntry = await tx.journalEntry.create({
      data: {
        projectId: oldEntry.projectId,
        date: reversalDate,
        description: `Hủy giao dịch: ${oldEntry.description}`,
        reference: `REV-${oldEntry.reference}`,
        sourceType: `${oldEntry.sourceType}_REVERSAL`,
        sourceId: oldEntry.sourceId,
        reversalRef: oldEntry.id,
        isPosted: true,
      }
    });

    for (const line of oldEntry.lines) {
      await tx.transactionLine.create({
        data: {
          journalEntryId: newEntry.id,
          accountId: line.accountId,
          amount: line.amount,
          type: line.type === "DEBIT" ? "CREDIT" : "DEBIT",
          description: `Hủy: ${line.description}`
        }
      });
    }

    if (sourceId && sourceType) {
      const lowerType = sourceType.toLowerCase();
      try {
        if (lowerType === "invoice") {
          await tx.invoice.update({
            where: { id: sourceId },
            data: { approvalStatus: "CANCELLED", deletedAt: new Date() }
          });
        } else if (lowerType === "cost" || lowerType === "costrecord") {
          await tx.costRecord.update({
            where: { id: sourceId },
            data: { approvalStatus: "CANCELLED", deletedAt: new Date() }
          });
        } else if (lowerType === "payment") {
          await tx.payment.update({
            where: { id: sourceId },
            data: { approvalStatus: "CANCELLED", deletedAt: new Date() }
          });
        } else if (lowerType === "vendor_payment" || lowerType === "vendorpayment") {
          await tx.vendorPayment.update({
            where: { id: sourceId },
            data: { isReversed: true, deletedAt: new Date() }
          });
        }
      } catch (err) {
        console.error(`[PostingEngine] Không thể cập nhật chứng từ nguồn ${sourceType}:${sourceId} khi hủy ghi sổ:`, err);
      }
    }
  }

  private static async resolveCompanyId(tx: any, projectId?: string | null) {
    if (!projectId) return undefined;
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { companyId: true }
    });
    return project?.companyId || undefined;
  }

  static async assertPeriodNotLocked(date: Date | string, companyId?: string | null) {
    const { assertPeriodNotLocked } = require("@/lib/period");
    await assertPeriodNotLocked(date, companyId || undefined);
  }
}
