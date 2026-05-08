import { prisma } from "@/lib/prisma";
import { TransactionType, CostType } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { Decimal } from "decimal.js";

/**
 * The Posting Engine automatically generates Double-Entry Journal Entries
 * for various ERP financial events.
 * 
 * HARDENED: Uses Decimal.js for zero-rounding-error accounting.
 */
export class PostingEngine {
  
  /**
   * Posts a Cost Record to the Ledger.
   */
  static async postCost(tx: any, params: {
    costId: string;
    projectId: string;
    amount: number | Decimal;
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
        { accountCode: expenseCode, amount: new Decimal(params.amount), type: TransactionType.DEBIT },
        { accountCode: apCode, amount: new Decimal(params.amount), type: TransactionType.CREDIT },
      ]
    });
  }

  /**
   * Posts an Invoice to the Ledger.
   */
  static async postInvoice(tx: any, params: {
    invoiceId: string;
    projectId: string;
    amount: number | Decimal;
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
        { accountCode: arCode, amount: new Decimal(params.amount), type: TransactionType.DEBIT },
        { accountCode: revenueCode, amount: new Decimal(params.amount), type: TransactionType.CREDIT },
      ]
    });
  }

  /**
   * Posts a Payment to the Ledger.
   */
  static async postPayment(tx: any, params: {
    paymentId: string;
    projectId: string;
    amount: number | Decimal;
    description: string;
  }) {
    const cashCode = "1010"; 
    const arCode = "1310";

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Thu tiền thanh toán: ${params.description}`,
      reference: `PAY-${params.paymentId}`,
      sourceType: "PAYMENT",
      sourceId: params.paymentId,
      lines: [
        { accountCode: cashCode, amount: new Decimal(params.amount), type: TransactionType.DEBIT },
        { accountCode: arCode, amount: new Decimal(params.amount), type: TransactionType.CREDIT },
      ]
    });
  }

  /**
   * Posts a Standalone Revenue Record to the Ledger.
   */
  static async postRevenue(tx: any, params: {
    revenueId: string;
    projectId: string;
    amount: number | Decimal;
    description: string;
    isPaid: boolean;
  }) {
    const debitCode = params.isPaid ? "1010" : "1310";
    const revenueCode = "5110";

    await this.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Ghi nhận doanh thu: ${params.description}`,
      reference: `REV-${params.revenueId}`,
      sourceType: "REVENUE",
      sourceId: params.revenueId,
      lines: [
        { accountCode: debitCode, amount: new Decimal(params.amount), type: TransactionType.DEBIT },
        { accountCode: revenueCode, amount: new Decimal(params.amount), type: TransactionType.CREDIT },
      ]
    });
  }

  /**
   * Reverses all journal entries related to a source record.
   */
  static async reverseEntries(tx: any, params: {
    sourceId: string;
    sourceType: string;
    reason: string;
  }) {
    const originalEntries = await tx.journalEntry.findMany({
      where: {
        sourceId: params.sourceId,
        sourceType: params.sourceType,
        deletedAt: null 
      },
      include: {
        lines: true
      }
    });

    if (originalEntries.length === 0) return;

    for (const entry of originalEntries) {
      const reversalEntry = await tx.journalEntry.create({
        data: {
          projectId: entry.projectId,
          description: `ĐẢO BÚT TOÁN: ${params.reason} (Gốc: ${entry.description})`,
          reference: `REV-${entry.reference}`,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
          isPosted: true,
        }
      });

      for (const line of entry.lines) {
        await tx.transactionLine.create({
          data: {
            journalEntryId: reversalEntry.id,
            accountId: line.accountId,
            amount: line.amount, // Prisma Decimal is used here
            type: line.type === TransactionType.DEBIT ? TransactionType.CREDIT : TransactionType.DEBIT,
            description: `Đảo bút toán cho: ${line.description}`
          }
        });
      }

      await tx.journalEntry.update({
        where: { id: entry.id },
        data: { deletedAt: new Date() }
      });
    }
  }

  // ─── PRIVATE HELPERS ────────────────────────────────

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

  private static async createDoubleEntry(tx: any, params: {
    projectId: string;
    description: string;
    reference: string;
    sourceType: string;
    sourceId: string;
    lines: { accountCode: string, amount: Decimal, type: TransactionType }[];
  }) {
    // 1. Verify Debit = Credit using Decimal
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of params.lines) {
      if (line.type === TransactionType.DEBIT) totalDebit = totalDebit.plus(line.amount);
      else totalCredit = totalCredit.plus(line.amount);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new ApiError(500, `Lỗi kế toán: Debit (${totalDebit.toString()}) không bằng Credit (${totalCredit.toString()})`);
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
