import { prisma } from "@/lib/prisma";
import { TransactionType, CostType } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

/**
 * The Posting Engine automatically generates Double-Entry Journal Entries
 * for various ERP financial events.
 */
export class PostingEngine {
  
  /**
   * Posts a Cost Record to the Ledger.
   * Logic: 
   * Debit: Expense (6210, 6220, etc.)
   * Credit: Accounts Payable (3310)
   */
  static async postCost(tx: any, params: {
    costId: string;
    projectId: string;
    amount: number;
    costType: CostType;
    description: string;
    purchaseOrderId?: string;
  }) {
    const expenseCode = this.getExpenseCode(params.costType);
    const apCode = "3310"; // Accounts Payable
    const grniCode = "3311"; // GRNI (Phải trả người bán chưa có hóa đơn/Hàng về chưa hóa đơn)

    const debitAccount = params.purchaseOrderId ? grniCode : expenseCode;

    // Fetch CostRecord to split VAT properly
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
      lines
    });
  }

  /**
   * Posts a Goods Receipt to the Ledger.
   * Logic:
   * Debit: Inventory/WIP (6210/6220/152)
   * Credit: GRNI (3311)
   */
  static async postGoodsReceipt(tx: any, params: {
    receiptId: string;
    projectId: string;
    amount: number;
    costType: CostType;
    description: string;
  }) {
    const expenseCode = this.getExpenseCode(params.costType);
    const grniCode = "3311"; 

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Nhập kho / Nhận hàng: ${params.description}`,
      reference: `GRN-${params.receiptId}`,
      sourceType: "GRN",
      sourceId: params.receiptId,
      lines: [
        { accountCode: expenseCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: grniCode, amount: params.amount, type: TransactionType.CREDIT },
      ]
    });
  }

  /**
   * Posts an Invoice to the Ledger.
   * Logic:
   * Debit: Accounts Receivable (1310)
   * Credit: Revenue (5110)
   */
  static async postInvoice(tx: any, params: {
    invoiceId: string;
    projectId: string;
    amount: number;
    description: string;
  }) {
    // Fetch Invoice to get detailed amounts
    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId }
    });

    if (!invoice) throw new ApiError(404, `Invoice not found for posting: ${params.invoiceId}`);

    const arCode = "1310"; // Accounts Receivable
    const retentionCode = "1368"; // Phải thu khác (Retention)
    const revenueCode = "5110"; // Revenue
    const vatCode = "33311"; // Thuế GTGT đầu ra

    // Fallbacks if missing
    const netAmount = Number(invoice.netAmount || invoice.amount);
    const vatAmount = Number(invoice.vatAmount || 0);
    const retentionAmount = Number(invoice.retentionAmount || 0);
    const claimAmount = Number(invoice.amount);

    const lines = [];

    // Debit AR
    if (claimAmount > 0) {
      lines.push({ accountCode: arCode, amount: claimAmount - retentionAmount, type: TransactionType.DEBIT });
    }

    // Debit Retention
    if (retentionAmount > 0) {
      lines.push({ accountCode: retentionCode, amount: retentionAmount, type: TransactionType.DEBIT });
    }

    // Credit Revenue
    if (netAmount > 0) {
      lines.push({ accountCode: revenueCode, amount: netAmount, type: TransactionType.CREDIT });
    }

    // Credit VAT
    if (vatAmount > 0) {
      lines.push({ accountCode: vatCode, amount: vatAmount, type: TransactionType.CREDIT });
    }

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Phát hành hóa đơn: ${params.description}`,
      reference: `INV-${params.invoiceId}`,
      sourceType: "INVOICE",
      sourceId: params.invoiceId,
      lines: lines
    });
  }

  /**
   * Posts a Payment to the Ledger.
   * Logic:
   * Debit: Cash/Bank (1010/1020)
   * Credit: Accounts Receivable (1310)
   */
  static async postPayment(tx: any, params: {
    paymentId: string;
    projectId: string;
    amount: number;
    description: string;
  }) {
    const cashCode = "1010"; // Assuming cash for now, could be bank
    const arCode = "1310";

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Thu tiền thanh toán: ${params.description}`,
      reference: `PAY-${params.paymentId}`,
      sourceType: "PAYMENT",
      sourceId: params.paymentId,
      lines: [
        { accountCode: cashCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: arCode, amount: params.amount, type: TransactionType.CREDIT },
      ]
    });
  }

  // ─── PRIVATE HELPERS ────────────────────────────────

  private static getExpenseCode(type: CostType): string {
    switch (type) {
      case "material": return "6210";
      case "labor": return "6220";
      case "machine": return "6230";
      case "subcontract": return "6270"; // Or separate code
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
    lines: { accountCode: string, amount: number, type: TransactionType }[];
  }) {
    const startTime = Date.now();
    // 0. Period Lock Check
    await this.assertPeriodNotLocked(new Date());

    // 0. Verify no duplicate posting for source record
    if (params.sourceId && params.sourceType) {
      const activeEntry = await tx.journalEntry.findFirst({
        where: { sourceId: params.sourceId, sourceType: params.sourceType, deletedAt: null }
      });
      if (activeEntry) {
        throw new ApiError(400, `Giao dịch đã được hạch toán vào Sổ cái trước đó (JournalEntry ID: ${activeEntry.id})`);
      }
    }

    // 1. Verify Debit = Credit
    const debits = params.lines.filter(l => l.type === TransactionType.DEBIT).reduce((s, l) => s + l.amount, 0);
    const credits = params.lines.filter(l => l.type === TransactionType.CREDIT).reduce((s, l) => s + l.amount, 0);

    if (Math.abs(debits - credits) > 0.01) {
      throw new ApiError(500, `Lỗi kế toán: Debit (${debits}) không bằng Credit (${credits})`);
    }

    // 2. Resolve account IDs
    const codes = params.lines.map(l => l.accountCode);
    const accounts = await tx.ledgerAccount.findMany({
      where: { code: { in: codes } }
    });

    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));

    // 3. Create Journal Entry
    const entry = await tx.journalEntry.create({
      data: {
        projectId: params.projectId,
        description: params.description,
        reference: params.reference,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        isPosted: true,
      }
    });

    // 4. Create Transaction Lines
    for (const line of params.lines) {
      const accountId = accountMap.get(line.accountCode);
      if (!accountId) throw new ApiError(500, `Account code not found: ${line.accountCode}`);

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

  /**
   * Reverses an existing Journal Entry (Immutable Ledger approach)
   */
  static async reverseJournal(tx: any, sourceId: string, sourceType: string, userId: string) {
    const oldEntry = await tx.journalEntry.findFirst({
      where: { sourceId, sourceType },
      include: { lines: true }
    });

    if (!oldEntry) return; // Nothing to reverse
    if (oldEntry.isReversed) throw new Error("Giao dịch đã được hủy trước đó.");

    // Period Lock Check for Reversal Entry (Reversals happen in the current period, not the original period)
    await this.assertPeriodNotLocked(new Date());

    // Mark old entry as reversed
    await tx.journalEntry.update({
      where: { id: oldEntry.id },
      data: { isReversed: true, reversedById: userId }
    });

    // Create new reversing entry
    const newEntry = await tx.journalEntry.create({
      data: {
        projectId: oldEntry.projectId,
        description: `Hủy giao dịch: ${oldEntry.description}`,
        reference: `REV-${oldEntry.reference}`,
        sourceType: oldEntry.sourceType,
        sourceId: oldEntry.sourceId,
        reversalRef: oldEntry.id,
        isPosted: true,
      }
    });

    // Reverse lines (Swap DEBIT/CREDIT)
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

    // Update Operational source to reflect reversal in reporting/operations
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
        console.error(`[PostingEngine] Failed to update operational source ${sourceType}:${sourceId} on reversal:`, err);
      }
    }
  }

  static async assertPeriodNotLocked(date: Date) {
    const { assertPeriodNotLocked } = require("@/lib/period");
    await assertPeriodNotLocked(date);
  }
}
