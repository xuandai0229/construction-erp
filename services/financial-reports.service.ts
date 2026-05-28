import { prisma } from "@/lib/prisma";
import { safeDecimal, safeMoney } from "@/lib/math";
import { Decimal } from "decimal.js";

export class FinancialReportsService {
  /**
   * Tính toán báo cáo tài chính tổng quan từng công trình (Project Overview Report)
   */
  static async getProjectFinancialOverview(projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, name: true, contractValue: true }
    });

    if (!project) {
      throw new Error("Không tìm thấy công trình.");
    }

    // 1. Tổng giá trị hợp đồng
    const contracts = await prisma.contract.findMany({
      where: { projectId, deletedAt: null }
    });
    const contractValueSum = contracts.reduce(
      (sum, c) => sum.add(safeDecimal(c.currentValue)),
      safeDecimal(project.contractValue || 0)
    );

    // 2. Nghiệm thu
    const acceptances = await prisma.acceptance.findMany({
      where: { contract: { projectId, deletedAt: null }, deletedAt: null }
    });
    const totalAcceptance = acceptances.reduce(
      (sum, a) => sum.add(safeDecimal(a.amount)),
      safeDecimal(0)
    );

    // 3. Đã xuất hóa đơn
    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null }
    });
    const totalInvoice = invoices.reduce(
      (sum, i) => sum.add(safeDecimal(i.amount)),
      safeDecimal(0)
    );

    // 4. Thanh toán & Tạm ứng (Operational payments)
    const payments = await prisma.payment.findMany({
      where: { projectId, deletedAt: null }
    });
    const totalPayment = payments.reduce(
      (sum, p) => sum.add(safeDecimal(p.amount)),
      safeDecimal(0)
    );
    const totalAdvance = payments
      .filter(p => !p.invoiceId)
      .reduce((sum, p) => sum.add(safeDecimal(p.amount)), safeDecimal(0));

    // 5. Chi phí & Doanh thu & Công nợ (Ledger-driven - Chuẩn kế toán kép)
    const ledgerOverview = await this.getLedgerFinancialOverview(projectId);

    return {
      projectId,
      projectName: project.name,
      contractValue: contractValueSum.toNumber(),
      totalAcceptance: totalAcceptance.toNumber(),
      totalInvoice: totalInvoice.toNumber(),
      totalAdvance: totalAdvance.toNumber(),
      totalPayment: totalPayment.toNumber(),
      // Sổ cái
      accountsReceivable: ledgerOverview.accountsReceivable, // Công nợ phải thu (131)
      accountsPayable: ledgerOverview.accountsPayable,       // Công nợ phải trả (331)
      projectCost: ledgerOverview.projectCost,               // Chi phí công trình (621, 622, 623, 627)
      projectRevenue: ledgerOverview.projectRevenue,         // Doanh thu công trình (511, 515)
      profit: ledgerOverview.profit,                         // Lãi/Lỗ công trình (Doanh thu - Chi phí)
      cashIn: ledgerOverview.cashIn,                         // Dòng tiền vào
      cashOut: ledgerOverview.cashOut,                       // Dòng tiền ra
      netCashFlow: ledgerOverview.netCashFlow,               // Dòng tiền thuần (Thu - Chi)
    };
  }

  /**
   * Tính toán dữ liệu tài chính dựa trên hạch toán Sổ cái (Ledger-driven)
   */
  private static async getLedgerFinancialOverview(projectId: string) {
    // 1. Phải thu khách hàng (TK 131) - Số dư Nợ của TK 131
    const accountsReceivable = await this.getAccountBalance(projectId, "131", "DEBIT");

    // 2. Phải trả người bán (TK 331) - Số dư Có của TK 331
    const accountsPayable = await this.getAccountBalance(projectId, "331", "CREDIT");

    // 3. Chi phí công trình (Tập hợp các tài khoản đầu 6: 621, 622, 623, 627)
    const cost621 = await this.getAccountAccumulated(projectId, "621", "DEBIT");
    const cost622 = await this.getAccountAccumulated(projectId, "622", "DEBIT");
    const cost623 = await this.getAccountAccumulated(projectId, "623", "DEBIT");
    const cost627 = await this.getAccountAccumulated(projectId, "627", "DEBIT");
    const projectCost = cost621.add(cost622).add(cost623).add(cost627);

    // 4. Doanh thu công trình (Tài khoản 511, 515)
    const rev511 = await this.getAccountAccumulated(projectId, "511", "CREDIT");
    const rev515 = await this.getAccountAccumulated(projectId, "515", "CREDIT");
    const projectRevenue = rev511.add(rev515);

    // 5. Lãi / Lỗ công trình
    const profit = projectRevenue.sub(projectCost);

    // 6. Dòng tiền (TK 111, 112)
    const cashIn111 = await this.getAccountAccumulated(projectId, "111", "DEBIT");
    const cashIn112 = await this.getAccountAccumulated(projectId, "112", "DEBIT");
    const cashIn = cashIn111.add(cashIn112);

    const cashOut111 = await this.getAccountAccumulated(projectId, "111", "CREDIT");
    const cashOut112 = await this.getAccountAccumulated(projectId, "112", "CREDIT");
    const cashOut = cashOut111.add(cashOut112);

    const netCashFlow = cashIn.sub(cashOut);

    return {
      accountsReceivable: accountsReceivable.toNumber(),
      accountsPayable: accountsPayable.toNumber(),
      projectCost: projectCost.toNumber(),
      projectRevenue: projectRevenue.toNumber(),
      profit: profit.toNumber(),
      cashIn: cashIn.toNumber(),
      cashOut: cashOut.toNumber(),
      netCashFlow: netCashFlow.toNumber(),
    };
  }

  /**
   * Tính số dư tài khoản (Sổ cái)
   */
  private static async getAccountBalance(projectId: string, accountCode: string, normalBalance: "DEBIT" | "CREDIT") {
    const acc = await prisma.ledgerAccount.findFirst({
      where: { code: accountCode, deletedAt: null }
    });
    if (!acc) return safeDecimal(0);

    // Tìm tất cả các tài khoản con của tài khoản này
    const childAccounts = await prisma.ledgerAccount.findMany({
      where: { parentId: acc.id, deletedAt: null }
    });
    const accountIds = [acc.id, ...childAccounts.map(c => c.id)];

    const lines = await prisma.transactionLine.findMany({
      where: {
        accountId: { in: accountIds },
        journalEntry: { projectId, deletedAt: null, isPosted: true }
      }
    });

    let debitSum = safeDecimal(0);
    let creditSum = safeDecimal(0);

    for (const l of lines) {
      if (l.type === "DEBIT") {
        debitSum = debitSum.add(safeDecimal(l.amount));
      } else {
        creditSum = creditSum.add(safeDecimal(l.amount));
      }
    }

    return normalBalance === "DEBIT" ? debitSum.sub(creditSum) : creditSum.sub(debitSum);
  }

  /**
   * Tính tổng lũy kế phát sinh của tài khoản (Sổ cái)
   */
  private static async getAccountAccumulated(projectId: string, accountCode: string, type: "DEBIT" | "CREDIT") {
    const acc = await prisma.ledgerAccount.findFirst({
      where: { code: accountCode, deletedAt: null }
    });
    if (!acc) return safeDecimal(0);

    // Tìm tất cả các tài khoản con của tài khoản này
    const childAccounts = await prisma.ledgerAccount.findMany({
      where: { parentId: acc.id, deletedAt: null }
    });
    const accountIds = [acc.id, ...childAccounts.map(c => c.id)];

    const lines = await prisma.transactionLine.findMany({
      where: {
        accountId: { in: accountIds },
        type,
        journalEntry: { projectId, deletedAt: null, isPosted: true }
      }
    });

    return lines.reduce((sum, l) => sum.add(safeDecimal(l.amount)), safeDecimal(0));
  }

  /**
   * Báo cáo lãi/lỗ chi tiết của tất cả các công trình
   */
  static async getProjectsProfitLossReport() {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true }
    });

    const reportRows = [];
    for (const p of projects) {
      const overview = await this.getProjectFinancialOverview(p.id);
      reportRows.push(overview);
    }

    return reportRows;
  }

  /**
   * Báo cáo công nợ tổng hợp (Phải thu/Phải trả) theo các nhà cung cấp / đối tác
   */
  static async getDebtReport(projectId?: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, name: true }
    });

    const reportRows = [];
    for (const s of suppliers) {
      // 1. Tính công nợ phải trả (TK 331) cho nhà cung cấp này
      const acc331 = await prisma.ledgerAccount.findFirst({ where: { code: "331" } });
      let accountsPayable = safeDecimal(0);
      if (acc331) {
        const lines = await prisma.transactionLine.findMany({
          where: {
            accountId: acc331.id,
            journalEntry: {
              ...(projectId && { projectId }),
              deletedAt: null,
              isPosted: true,
              sourceType: { in: ["COST", "PAYMENT", "VENDOR_PAYMENT"] } // Lọc theo nghiệp vụ liên quan
            }
          }
        });
        
        let debitSum = safeDecimal(0);
        let creditSum = safeDecimal(0);
        for (const l of lines) {
          if (l.type === "DEBIT") debitSum = debitSum.add(safeDecimal(l.amount));
          else creditSum = creditSum.add(safeDecimal(l.amount));
        }
        accountsPayable = creditSum.sub(debitSum);
      }

      // 2. Tính công nợ phải thu (TK 131) nếu đối tác này là khách hàng
      const acc131 = await prisma.ledgerAccount.findFirst({ where: { code: "131" } });
      let accountsReceivable = safeDecimal(0);
      if (acc131) {
        const lines = await prisma.transactionLine.findMany({
          where: {
            accountId: acc131.id,
            journalEntry: {
              ...(projectId && { projectId }),
              deletedAt: null,
              isPosted: true
            }
          }
        });
        
        let debitSum = safeDecimal(0);
        let creditSum = safeDecimal(0);
        for (const l of lines) {
          if (l.type === "DEBIT") debitSum = debitSum.add(safeDecimal(l.amount));
          else creditSum = creditSum.add(safeDecimal(l.amount));
        }
        accountsReceivable = debitSum.sub(creditSum);
      }

      if (accountsPayable.gt(0) || accountsReceivable.gt(0)) {
        reportRows.push({
          supplierId: s.id,
          supplierCode: s.code,
          supplierName: s.name,
          accountsPayable: accountsPayable.toNumber(),
          accountsReceivable: accountsReceivable.toNumber(),
        });
      }
    }

    return reportRows;
  }

  /**
   * Báo cáo dòng tiền tổng hợp theo công trình hoặc toàn công ty
   */
  static async getCashFlowReport(projectId?: string) {
    // Tập hợp phát sinh tiền mặt (111) và tiền gửi ngân hàng (112) theo từng tháng
    const where: any = {
      journalEntry: {
        ...(projectId && { projectId }),
        deletedAt: null,
        isPosted: true
      }
    };

    const acc111 = await prisma.ledgerAccount.findFirst({ where: { code: "111" } });
    const acc112 = await prisma.ledgerAccount.findFirst({ where: { code: "112" } });
    const accountIds = [];
    if (acc111) accountIds.push(acc111.id);
    if (acc112) accountIds.push(acc112.id);

    where.accountId = { in: accountIds };

    const transactionLines = await prisma.transactionLine.findMany({
      where,
      include: {
        journalEntry: true
      },
      orderBy: { journalEntry: { date: "asc" } }
    });

    const monthlyCashFlow: Record<string, { cashIn: Decimal; cashOut: Decimal }> = {};

    for (const line of transactionLines) {
      const date = line.journalEntry.date;
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyCashFlow[monthStr]) {
        monthlyCashFlow[monthStr] = { cashIn: safeDecimal(0), cashOut: safeDecimal(0) };
      }

      const amount = safeDecimal(line.amount);
      if (line.type === "DEBIT") {
        // Nợ TK Tiền => Tiền tăng => Dòng tiền vào
        monthlyCashFlow[monthStr].cashIn = monthlyCashFlow[monthStr].cashIn.add(amount);
      } else {
        // Có TK Tiền => Tiền giảm => Dòng tiền ra
        monthlyCashFlow[monthStr].cashOut = monthlyCashFlow[monthStr].cashOut.add(amount);
      }
    }

    let runningBalance = safeDecimal(0);
    const reportRows = Object.keys(monthlyCashFlow).sort().map(month => {
      const flow = monthlyCashFlow[month];
      const netFlow = flow.cashIn.sub(flow.cashOut);
      runningBalance = runningBalance.add(netFlow);

      return {
        month,
        cashIn: flow.cashIn.toNumber(),
        cashOut: flow.cashOut.toNumber(),
        netFlow: netFlow.toNumber(),
        runningBalance: runningBalance.toNumber()
      };
    });

    return reportRows;
  }
}
