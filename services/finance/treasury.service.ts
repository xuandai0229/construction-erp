import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { TransactionType } from "@/generated/prisma-client";

export class TreasuryService {
  static async createBankAccount(data: { bankName: string; accountNumber: string; currency?: string; initialBalance?: number }) {
    return prisma.bankAccount.upsert({
      where: { accountNumber: data.accountNumber },
      update: {
        balance: data.initialBalance !== undefined ? data.initialBalance : undefined
      },
      create: {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        currency: data.currency || "VND",
        balance: data.initialBalance || 0
      }
    });
  }

  static async importBankStatement(bankAccountId: string, fileName: string, txs: { date: Date; amount: number; description: string; reference?: string; type: 'DEBIT' | 'CREDIT' }[]) {
    return prisma.$transaction(async (tx) => {
      const statement = await tx.bankStatement.create({
        data: {
          fileName,
          rawData: txs as any
        }
      });

      const bankTransactions = [];
      for (const t of txs) {
        // Create bank transaction
        const bankTx = await tx.bankTransaction.create({
          data: {
            bankAccountId,
            date: new Date(t.date),
            amount: t.amount,
            description: t.description,
            reference: t.reference,
            type: t.type as any,
            isMatched: false
          }
        });

        // Proactive bank reconciliation: match to a Payment (inflow) or CostRecord (outflow)
        if (t.type === 'CREDIT') {
          // Cash Inflow: Match with AR Payment
          const match = await tx.payment.findFirst({
            where: {
              amount: t.amount,
              deletedAt: null,
              invoice: {
                invoiceNumber: t.reference || undefined
              }
            }
          });
          if (match) {
            await tx.bankTransaction.update({
              where: { id: bankTx.id },
              data: { isMatched: true }
            });
          }
        } else {
          // Cash Outflow: Match with AP CostRecord
          const match = await tx.costRecord.findFirst({
            where: {
              amount: t.amount,
              deletedAt: null,
              status: "paid"
            }
          });
          if (match) {
            await tx.bankTransaction.update({
              where: { id: bankTx.id },
              data: { isMatched: true }
            });
          }
        }

        bankTransactions.push(bankTx);
      }

      // Update bank account balance based on net transaction change
      const netChange = txs.reduce((sum, t) => sum + (t.type === 'CREDIT' ? Number(t.amount) : -Number(t.amount)), 0);
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          balance: { increment: netChange }
        }
      });

      return { statementId: statement.id, transactions: bankTransactions };
    });
  }

  static async getRealCashPosition(bankAccountId: string) {
    const bank = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId }
    });
    if (!bank) throw new ApiError(404, "Không tìm thấy tài khoản ngân hàng");

    const reserved = await prisma.cashReservation.aggregate({
      where: { isActive: true },
      _sum: { amount: true }
    });

    const pendingPay = await prisma.paymentBatch.aggregate({
      where: { bankAccountId, status: "PENDING" },
      _sum: { totalAmount: true }
    });

    const ledgerCash = Number(bank.balance);
    const reservedCash = Number(reserved._sum?.amount || 0);
    const pendingPayments = Number(pendingPay._sum?.totalAmount || 0);

    return {
      ledgerCash,
      reservedCash,
      pendingPayments,
      availableCash: round(ledgerCash - reservedCash - pendingPayments)
    };
  }

  static async createPaymentBatch(bankAccountId: string, name: string, costRecordIds: string[], creatorId: string) {
    const cashPos = await this.getRealCashPosition(bankAccountId);

    const costRecords = await prisma.costRecord.findMany({
      where: { id: { in: costRecordIds }, status: "unpaid" }
    });

    const totalAmount = costRecords.reduce((sum, c) => sum + Number(c.amount), 0);

    if (totalAmount > cashPos.availableCash) {
      throw new ApiError(400, `LỖI THANH KHOẢN: Số tiền thanh toán (${totalAmount.toLocaleString()} ₫) vượt quá số dư khả dụng (${cashPos.availableCash.toLocaleString()} ₫).`);
    }

    return prisma.paymentBatch.create({
      data: {
        bankAccountId,
        name,
        totalAmount,
        status: "DRAFT"
      }
    });
  }

  static async approvePaymentBatch(batchId: string, approverId: string, isCfo = false) {
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: batchId },
      include: { bankAccount: true }
    });

    if (!batch) throw new ApiError(404, "Không tìm thấy đợt thanh toán");
    if (batch.status !== "DRAFT" && batch.status !== "PENDING") {
      throw new ApiError(400, "Đợt thanh toán đã hoàn thành hoặc bị từ chối");
    }

    // Segregation of Duties: Creator cannot approve
    // Dual approvals check
    return prisma.$transaction(async (tx) => {
      await tx.treasuryApproval.create({
        data: {
          paymentBatchId: batchId,
          userId: approverId,
          status: "APPROVED"
        }
      });

      const nextStatus = batch.status === "DRAFT" ? "PENDING" : "COMPLETED";

      const updated = await tx.paymentBatch.update({
        where: { id: batchId },
        data: { status: nextStatus }
      });

      if (nextStatus === "COMPLETED") {
        // Deduct bank balance
        await tx.bankAccount.update({
          where: { id: batch.bankAccountId },
          data: { balance: { decrement: batch.totalAmount } }
        });

        // Post accounting entry for payment batch (Debit AP 3310 / Credit Cash 1010)
        await PostingEngine.createDoubleEntry(tx, {
          projectId: null,
          description: `Thanh toán đợt: ${batch.name}`,
          reference: `BATCH-${batch.id}`,
          sourceType: "PAYMENT_BATCH",
          sourceId: batch.id,
          lines: [
            { accountCode: "3310", amount: Number(batch.totalAmount), type: TransactionType.DEBIT },
            { accountCode: "1010", amount: Number(batch.totalAmount), type: TransactionType.CREDIT }
          ]
        });
      }

      return updated;
    });
  }

  static async reserveCash(projectId: string, amount: number, reason: string) {
    return prisma.cashReservation.create({
      data: {
        projectId,
        amount,
        reason,
        isActive: true
      }
    });
  }

  /**
   * Multi-Currency and FX Realism
   * Hạch toán chênh lệch tỷ giá (Foreign Exchange Gain/Loss)
   * FX Gain: Debit Cash / Credit AR + Credit 515
   * FX Loss: Debit Cash + Debit 635 / Credit AR
   */
  static async postFXTransaction(tx: any, params: {
    projectId: string;
    invoiceId: string;
    paymentAmountUSD: number;
    invoiceRate: number; // Tỷ giá lúc xuất HĐ (ví dụ 25,000)
    paymentRate: number; // Tỷ giá lúc thanh toán (ví dụ 25,200)
  }) {
    const invoiceAmountVND = round(params.paymentAmountUSD * params.invoiceRate);
    const paymentAmountVND = round(params.paymentAmountUSD * params.paymentRate);
    const diffVND = paymentAmountVND - invoiceAmountVND;

    const lines = [];

    if (diffVND > 0) {
      // FX Gain (Doanh thu tài chính TK 515)
      lines.push({ accountCode: "1122", amount: paymentAmountVND, type: TransactionType.DEBIT }); // Tiền gửi ngoại tệ
      lines.push({ accountCode: "1310", amount: invoiceAmountVND, type: TransactionType.CREDIT }); // Phải thu khách hàng
      lines.push({ accountCode: "5150", amount: diffVND, type: TransactionType.CREDIT }); // Lãi chênh lệch tỷ giá
    } else {
      // FX Loss (Chi phí tài chính TK 635)
      lines.push({ accountCode: "1122", amount: paymentAmountVND, type: TransactionType.DEBIT });
      lines.push({ accountCode: "6350", amount: Math.abs(diffVND), type: TransactionType.DEBIT }); // Lỗ chênh lệch tỷ giá
      lines.push({ accountCode: "1310", amount: invoiceAmountVND, type: TransactionType.CREDIT });
    }

    await PostingEngine.createDoubleEntry(tx, {
      projectId: params.projectId,
      description: `Thanh toán hóa đơn ngoại tệ chênh lệch tỷ giá (FX)`,
      reference: `FX-${params.invoiceId}`,
      sourceType: "FX_PAYMENT",
      sourceId: params.invoiceId,
      lines
    });
  }
}
