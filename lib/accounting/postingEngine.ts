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
  }) {
    const expenseCode = this.getExpenseCode(params.costType);
    const apCode = "3310"; // Accounts Payable

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Ghi nhận chi phí: ${params.description}`,
      reference: `COST-${params.costId}`,
      sourceType: "COST",
      sourceId: params.costId,
      lines: [
        { accountCode: expenseCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: apCode, amount: params.amount, type: TransactionType.CREDIT },
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
    const arCode = "1310"; // Accounts Receivable
    const revenueCode = "5110"; // Revenue

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Phát hành hóa đơn: ${params.description}`,
      reference: `INV-${params.invoiceId}`,
      sourceType: "INVOICE",
      sourceId: params.invoiceId,
      lines: [
        { accountCode: arCode, amount: params.amount, type: TransactionType.DEBIT },
        { accountCode: revenueCode, amount: params.amount, type: TransactionType.CREDIT },
      ]
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

  private static async createDoubleEntry(tx: any, params: {
    projectId: string;
    description: string;
    reference: string;
    sourceType: string;
    sourceId: string;
    lines: { accountCode: string, amount: number, type: TransactionType }[];
  }) {
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
  }
}
