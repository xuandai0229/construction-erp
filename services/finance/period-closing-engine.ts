import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { TransactionType } from "@prisma/client";

/**
 * Enterprise Period Closing Engine
 * 
 * Handles the complete lifecycle of accounting period closing:
 * 1. Validate ledger balance (Debit == Credit)
 * 2. Generate closing journals (Revenue → 911 → 421)
 * 3. Generate immutable financial snapshots
 * 4. Lock the accounting period
 * 
 * Conforms to VAS/IFRS standards and SAP FI/CO closing procedures.
 */
export class PeriodClosingEngine {

  /**
   * Execute full period closing for a specific project within a period.
   * This is an atomic transaction — either everything succeeds or nothing changes.
   */
  static async executePeriodClosing(
    periodId: string,
    projectId: string,
    userId: string,
    companyId: string
  ) {
    return await prisma.$transaction(async (tx) => {

      // ═══════════════════════════════════════════════
      // STEP 0: VALIDATE PERIOD EXISTS AND IS OPEN
      // ═══════════════════════════════════════════════
      const period = await tx.accountingPeriod.findUnique({
        where: { id: periodId },
        include: { fiscalYear: true }
      });

      if (!period) {
        throw new ApiError(404, "Kỳ kế toán không tồn tại.");
      }
      if (period.status === "CLOSED") {
        throw new ApiError(422, `Kỳ kế toán ${period.month} đã được khóa sổ trước đó.`);
      }
      if (period.fiscalYear.companyId !== companyId) {
        throw new ApiError(403, "Không có quyền khóa sổ kỳ kế toán của doanh nghiệp khác.");
      }

      // Validate project belongs to same company
      const project = await tx.project.findFirst({
        where: { id: projectId, companyId, deletedAt: null }
      });
      if (!project) {
        throw new ApiError(404, "Dự án không tồn tại hoặc không thuộc doanh nghiệp.");
      }

      // ═══════════════════════════════════════════════
      // STEP 1: VALIDATE LEDGER BALANCE
      // ═══════════════════════════════════════════════
      const [debitAgg, creditAgg] = await Promise.all([
        tx.transactionLine.aggregate({
          where: {
            type: "DEBIT",
            journalEntry: { projectId, deletedAt: null },
            deletedAt: null
          },
          _sum: { amount: true }
        }),
        tx.transactionLine.aggregate({
          where: {
            type: "CREDIT",
            journalEntry: { projectId, deletedAt: null },
            deletedAt: null
          },
          _sum: { amount: true }
        })
      ]);

      const totalDebit = Number(debitAgg._sum?.amount || 0);
      const totalCredit = Number(creditAgg._sum?.amount || 0);
      const imbalance = Math.abs(totalDebit - totalCredit);

      if (imbalance >= 1.0) {
        throw new ApiError(422,
          `Khóa sổ thất bại: Sổ cái không cân bằng. Tổng Nợ: ${totalDebit.toLocaleString()}, Tổng Có: ${totalCredit.toLocaleString()}, Lệch: ${imbalance.toLocaleString()} VND.`
        );
      }

      // ═══════════════════════════════════════════════
      // STEP 2: GENERATE CLOSING JOURNALS
      // ═══════════════════════════════════════════════
      const closingJournalId = await this.generateClosingJournals(
        tx, period, projectId, userId
      );

      // ═══════════════════════════════════════════════
      // STEP 3: GENERATE IMMUTABLE SNAPSHOTS
      // ═══════════════════════════════════════════════
      await this.generateSnapshots(
        tx, periodId, projectId, userId, period.startDate, period.endDate
      );

      // ═══════════════════════════════════════════════
      // STEP 4: LOCK THE ACCOUNTING PERIOD
      // ═══════════════════════════════════════════════
      await tx.accountingPeriod.update({
        where: { id: periodId },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          closedById: userId
        }
      });

      // ═══════════════════════════════════════════════
      // STEP 5: AUDIT LOG
      // ═══════════════════════════════════════════════
      await tx.auditLog.create({
        data: {
          userId,
          action: "PERIOD_CLOSE",
          entity: "AccountingPeriod",
          entityId: periodId,
          severity: "INFO",
          newData: {
            month: period.month,
            projectId,
            closingJournalId,
            closedAt: new Date().toISOString()
          }
        }
      });

      return {
        success: true,
        periodId,
        month: period.month,
        closingJournalId,
        message: `Kỳ kế toán ${period.month} đã được khóa sổ thành công.`
      };
    }, { timeout: 30000 }); // 30s timeout for closing transaction
  }

  /**
   * Generate closing journal entries for period-end.
   * Standard VAS closing flow:
   *   1. Revenue Closing: Debit 511 → Credit 911
   *   2. Expense Closing: Debit 911 → Credit 62x
   *   3. Profit Transfer: 911 → 421 (Profit) or 421 → 911 (Loss)
   */
  private static async generateClosingJournals(
    tx: any,
    period: any,
    projectId: string,
    userId: string
  ): Promise<string | null> {
    // Calculate net revenue within the period
    const [revCredit, revDebit] = await Promise.all([
      tx.transactionLine.aggregate({
        where: {
          account: { code: { startsWith: '511' } },
          type: 'CREDIT',
          journalEntry: {
            projectId, deletedAt: null, isClosing: false,
            date: { gte: period.startDate, lte: period.endDate }
          },
          deletedAt: null
        },
        _sum: { amount: true }
      }),
      tx.transactionLine.aggregate({
        where: {
          account: { code: { startsWith: '511' } },
          type: 'DEBIT',
          journalEntry: {
            projectId, deletedAt: null, isClosing: false,
            date: { gte: period.startDate, lte: period.endDate }
          },
          deletedAt: null
        },
        _sum: { amount: true }
      })
    ]);

    const netRevenue = Number(revCredit._sum?.amount || 0) - Number(revDebit._sum?.amount || 0);

    // Calculate net cost within the period
    const [costDebit, costCredit] = await Promise.all([
      tx.transactionLine.aggregate({
        where: {
          account: { code: { startsWith: '62' } },
          type: 'DEBIT',
          journalEntry: {
            projectId, deletedAt: null, isClosing: false,
            date: { gte: period.startDate, lte: period.endDate }
          },
          deletedAt: null
        },
        _sum: { amount: true }
      }),
      tx.transactionLine.aggregate({
        where: {
          account: { code: { startsWith: '62' } },
          type: 'CREDIT',
          journalEntry: {
            projectId, deletedAt: null, isClosing: false,
            date: { gte: period.startDate, lte: period.endDate }
          },
          deletedAt: null
        },
        _sum: { amount: true }
      })
    ]);

    const netCost = Number(costDebit._sum?.amount || 0) - Number(costCredit._sum?.amount || 0);

    // If no activity in the period, skip closing journals
    if (netRevenue === 0 && netCost === 0) {
      return null;
    }

    const netProfit = netRevenue - netCost;

    // Resolve account IDs
    const accountCodes = ['5110', '6210', '6220', '6230', '6270', '9110', '4210'];
    const accounts = await tx.ledgerAccount.findMany({
      where: { code: { in: accountCodes } }
    });
    const acctMap = new Map(accounts.map((a: any) => [a.code, a.id]));

    // Ensure account 911 and 421 exist (create if missing)
    let acct911Id = acctMap.get('9110');
    if (!acct911Id) {
      const acct911 = await tx.ledgerAccount.create({
        data: {
          code: '9110',
          name: 'Xác định kết quả kinh doanh',
          type: 'EXPENSE',
          description: 'Tài khoản trung gian kết chuyển cuối kỳ'
        }
      });
      acct911Id = acct911.id;
    }

    let acct421Id = acctMap.get('4210');
    if (!acct421Id) {
      const acct421 = await tx.ledgerAccount.create({
        data: {
          code: '4210',
          name: 'Lợi nhuận sau thuế chưa phân phối',
          type: 'EQUITY',
          description: 'Lợi nhuận tích lũy từ kết quả kinh doanh'
        }
      });
      acct421Id = acct421.id;
    }

    // Create the closing journal entry
    const closingEntry = await tx.journalEntry.create({
      data: {
        projectId,
        date: period.endDate,
        description: `Bút toán kết chuyển khóa sổ kỳ ${period.month}`,
        reference: `CLOSING-${period.month}-${projectId.substring(0, 8)}`,
        sourceType: "CLOSING",
        sourceId: period.id,
        isPosted: true,
        isClosing: true
      }
    });

    const closingLines: any[] = [];

    // A. Revenue Closing: Debit 511 → Credit 911
    if (netRevenue > 0) {
      // Find all 511 accounts with balances in this period
      const revAccounts = await tx.ledgerAccount.findMany({
        where: { code: { startsWith: '511' }, isActive: true }
      });

      for (const revAcct of revAccounts) {
        const rc = await tx.transactionLine.aggregate({
          where: {
            accountId: revAcct.id, type: 'CREDIT',
            journalEntry: { projectId, deletedAt: null, isClosing: false, date: { gte: period.startDate, lte: period.endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        });
        const rd = await tx.transactionLine.aggregate({
          where: {
            accountId: revAcct.id, type: 'DEBIT',
            journalEntry: { projectId, deletedAt: null, isClosing: false, date: { gte: period.startDate, lte: period.endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        });
        const acctBalance = Number(rc._sum?.amount || 0) - Number(rd._sum?.amount || 0);
        if (acctBalance > 0) {
          closingLines.push(
            { journalEntryId: closingEntry.id, accountId: revAcct.id, amount: acctBalance, type: TransactionType.DEBIT, description: `Kết chuyển doanh thu TK ${revAcct.code}` },
            { journalEntryId: closingEntry.id, accountId: acct911Id, amount: acctBalance, type: TransactionType.CREDIT, description: `Xác định kết quả doanh thu TK ${revAcct.code}` }
          );
        }
      }
    }

    // B. Expense Closing: Debit 911 → Credit 62x
    if (netCost > 0) {
      const costAccounts = await tx.ledgerAccount.findMany({
        where: { code: { startsWith: '62' }, isActive: true }
      });

      for (const costAcct of costAccounts) {
        const cd = await tx.transactionLine.aggregate({
          where: {
            accountId: costAcct.id, type: 'DEBIT',
            journalEntry: { projectId, deletedAt: null, isClosing: false, date: { gte: period.startDate, lte: period.endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        });
        const cc = await tx.transactionLine.aggregate({
          where: {
            accountId: costAcct.id, type: 'CREDIT',
            journalEntry: { projectId, deletedAt: null, isClosing: false, date: { gte: period.startDate, lte: period.endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        });
        const acctBalance = Number(cd._sum?.amount || 0) - Number(cc._sum?.amount || 0);
        if (acctBalance > 0) {
          closingLines.push(
            { journalEntryId: closingEntry.id, accountId: acct911Id, amount: acctBalance, type: TransactionType.DEBIT, description: `Kết chuyển chi phí TK ${costAcct.code}` },
            { journalEntryId: closingEntry.id, accountId: costAcct.id, amount: acctBalance, type: TransactionType.CREDIT, description: `Xác định kết quả chi phí TK ${costAcct.code}` }
          );
        }
      }
    }

    // C. Profit/Loss Transfer: 911 → 421
    if (netProfit > 0) {
      // Profit: Debit 911, Credit 421
      closingLines.push(
        { journalEntryId: closingEntry.id, accountId: acct911Id, amount: netProfit, type: TransactionType.DEBIT, description: `Kết chuyển lãi kỳ ${period.month} sang TK 421` },
        { journalEntryId: closingEntry.id, accountId: acct421Id, amount: netProfit, type: TransactionType.CREDIT, description: `Ghi nhận lợi nhuận tích lũy kỳ ${period.month}` }
      );
    } else if (netProfit < 0) {
      // Loss: Debit 421, Credit 911
      const absLoss = Math.abs(netProfit);
      closingLines.push(
        { journalEntryId: closingEntry.id, accountId: acct421Id, amount: absLoss, type: TransactionType.DEBIT, description: `Ghi nhận lỗ tích lũy kỳ ${period.month}` },
        { journalEntryId: closingEntry.id, accountId: acct911Id, amount: absLoss, type: TransactionType.CREDIT, description: `Kết chuyển lỗ kỳ ${period.month} sang TK 421` }
      );
    }

    // Batch insert all closing lines
    if (closingLines.length > 0) {
      await tx.transactionLine.createMany({ data: closingLines });
    }

    return closingEntry.id;
  }

  /**
   * Generate immutable financial snapshots for the closed period.
   */
  private static async generateSnapshots(
    tx: any,
    periodId: string,
    projectId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const accounts = await tx.ledgerAccount.findMany({
      where: { isActive: true, deletedAt: null }
    });

    const trialBalanceRows: any[] = [];
    const balanceSheetRows: any[] = [];

    for (const account of accounts) {
      // Period activity
      const [pDebitAgg, pCreditAgg] = await Promise.all([
        tx.transactionLine.aggregate({
          where: {
            accountId: account.id, type: "DEBIT",
            journalEntry: { projectId, deletedAt: null, date: { gte: startDate, lte: endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        }),
        tx.transactionLine.aggregate({
          where: {
            accountId: account.id, type: "CREDIT",
            journalEntry: { projectId, deletedAt: null, date: { gte: startDate, lte: endDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        })
      ]);

      const pDebit = Number(pDebitAgg._sum?.amount || 0);
      const pCredit = Number(pCreditAgg._sum?.amount || 0);

      // Opening balance (before period start)
      const [oDebitAgg, oCreditAgg] = await Promise.all([
        tx.transactionLine.aggregate({
          where: {
            accountId: account.id, type: "DEBIT",
            journalEntry: { projectId, deletedAt: null, date: { lt: startDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        }),
        tx.transactionLine.aggregate({
          where: {
            accountId: account.id, type: "CREDIT",
            journalEntry: { projectId, deletedAt: null, date: { lt: startDate } },
            deletedAt: null
          },
          _sum: { amount: true }
        })
      ]);

      const oDebit = Number(oDebitAgg._sum?.amount || 0);
      const oCredit = Number(oCreditAgg._sum?.amount || 0);

      const closingDebit = oDebit + pDebit;
      const closingCredit = oCredit + pCredit;
      const balance = closingDebit - closingCredit;

      // Only snapshot accounts with activity
      if (pDebit > 0 || pCredit > 0 || oDebit > 0 || oCredit > 0) {
        trialBalanceRows.push({
          accountingPeriodId: periodId,
          projectId,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          openingDebit: oDebit,
          openingCredit: oCredit,
          periodDebit: pDebit,
          periodCredit: pCredit,
          closingDebit,
          closingCredit,
          balance,
          generatedById: userId
        });

        if (["ASSET", "LIABILITY", "EQUITY"].includes(account.type)) {
          balanceSheetRows.push({
            accountingPeriodId: periodId,
            projectId,
            section: account.type,
            accountCode: account.code,
            accountName: account.name,
            balance,
            generatedById: userId
          });
        }
      }
    }

    // Batch insert snapshots
    if (trialBalanceRows.length > 0) {
      await tx.trialBalanceSnapshot.createMany({ data: trialBalanceRows });
    }
    if (balanceSheetRows.length > 0) {
      await tx.balanceSheetSnapshot.createMany({ data: balanceSheetRows });
    }

    // P&L Snapshot
    const totalRevenue = trialBalanceRows
      .filter(r => r.accountType === "REVENUE")
      .reduce((s, r) => s + r.periodCredit - r.periodDebit, 0);
    const totalCost = trialBalanceRows
      .filter(r => r.accountType === "EXPENSE")
      .reduce((s, r) => s + r.periodDebit - r.periodCredit, 0);
    const grossProfit = totalRevenue - totalCost;

    await tx.profitLossSnapshot.create({
      data: {
        accountingPeriodId: periodId,
        projectId,
        totalRevenue,
        totalCost,
        grossProfit,
        grossMargin: totalRevenue > 0 ? grossProfit / totalRevenue : 0,
        netProfit: grossProfit,
        generatedById: userId
      }
    });
  }

  /**
   * Reopen a closed accounting period.
   * CRITICAL ACTION: Deletes closing journals and snapshots. Requires CFO/Admin role.
   */
  static async reopenPeriod(
    periodId: string,
    userId: string,
    companyId: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ) {
    if (!reason || reason.trim().length < 10) {
      throw new ApiError(400, "Lý do mở lại kỳ kế toán phải có ít nhất 10 ký tự.");
    }

    return await prisma.$transaction(async (tx) => {
      const period = await tx.accountingPeriod.findUnique({
        where: { id: periodId },
        include: { fiscalYear: true }
      });

      if (!period) throw new ApiError(404, "Kỳ kế toán không tồn tại.");
      if (period.status === "OPEN") throw new ApiError(422, "Kỳ kế toán đang mở, không cần mở lại.");
      if (period.fiscalYear.companyId !== companyId) {
        throw new ApiError(403, "Không có quyền mở lại kỳ kế toán của doanh nghiệp khác.");
      }

      // Delete closing journals for this period
      const closingEntries = await tx.journalEntry.findMany({
        where: { sourceType: "CLOSING", sourceId: periodId, deletedAt: null }
      });
      for (const entry of closingEntries) {
        await tx.transactionLine.deleteMany({ where: { journalEntryId: entry.id } });
        await tx.journalEntry.delete({ where: { id: entry.id } });
      }

      // Delete snapshots
      await tx.trialBalanceSnapshot.deleteMany({ where: { accountingPeriodId: periodId } });
      await tx.balanceSheetSnapshot.deleteMany({ where: { accountingPeriodId: periodId } });
      await tx.profitLossSnapshot.deleteMany({ where: { accountingPeriodId: periodId } });

      // Reopen period
      await tx.accountingPeriod.update({
        where: { id: periodId },
        data: { status: "OPEN", closedAt: null, closedById: null }
      });

      // CRITICAL audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "PERIOD_REOPEN",
          entity: "AccountingPeriod",
          entityId: periodId,
          severity: "CRITICAL",
          reason,
          ipAddress,
          userAgent,
          oldData: { status: "CLOSED", closedAt: period.closedAt, closedById: period.closedById },
          newData: { status: "OPEN", reopenedAt: new Date().toISOString(), reason }
        }
      });

      return {
        success: true,
        periodId,
        month: period.month,
        message: `Kỳ kế toán ${period.month} đã được mở lại. Bút toán kết chuyển và snapshot đã bị xóa.`
      };
    });
  }
}
