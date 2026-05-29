import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ReportFilters {
  companyId: string;
  projectId?: string;
  contractId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fiscalPeriodId?: string;
}

export class ManagementReportService {
  /**
   * A. Báo cáo Tổng quan Tài chính (Executive Summary)
   */
  static async getExecutiveSummary(filters: ReportFilters) {
    const { companyId, projectId, dateFrom, dateTo } = filters;

    const companyProjects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true }
    });
    const projectIds = companyProjects.map(p => p.id);

    // Base where clause for documents
    const baseWhere = {
      companyId,
      ...(projectId ? { projectId } : {}),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        }
      } : {}),
      deletedAt: null
    };

    // 1. Doanh thu (Invoices - Output/AR)
    const invoices = await prisma.invoice.findMany({
      where: {
        ...baseWhere,
        approvalStatus: "APPROVED",
      },
      select: { amount: true, remainingAmount: true }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const receivables = invoices.reduce((sum, inv) => sum + Number(inv.remainingAmount), 0);

    // 2. Chi phí (CostRecords)
    const costs = await prisma.costRecord.findMany({
      where: {
        companyId,
        ...(projectId ? { projectId } : {}),
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          }
        } : {}),
        deletedAt: null,
        approvalStatus: "APPROVED"
      },
      select: { amount: true, status: true }
    });

    const totalCost = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    // Simplified payable: unpaid costs
    const payables = costs.reduce((sum, cost) => sum + (cost.status !== "paid" ? Number(cost.amount) : 0), 0);
    
    // Profit
    const profit = totalRevenue - totalCost;

    // 3. Tạm ứng (Advances)
    const advances = await prisma.advanceRequest.findMany({
      where: {
        companyId,
        ...(projectId ? { projectId } : {}),
        status: { in: ["APPROVED", "PARTIALLY_SETTLED"] },
        deletedAt: null
      },
      select: { remainingAmount: true }
    });
    const outstandingAdvances = advances.reduce((sum, adv) => sum + Number(adv.remainingAmount), 0);

    // 4. Dòng tiền (Payments)
    const payments = await prisma.payment.findMany({
      where: {
        projectId: { in: projectId ? [projectId] : projectIds },
        ...(dateFrom || dateTo ? {
          date: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          }
        } : {}),
        approvalStatus: "APPROVED",
        deletedAt: null
      },
      select: { amount: true }
    });

    let cashIn = 0;
    let cashOut = 0;
    payments.forEach(p => {
      cashIn += Number(p.amount);
    });
    
    costs.forEach(c => {
      if (c.status === "paid") {
         cashOut += Number(c.amount);
      }
    });

    const netCashflow = cashIn - cashOut;

    // 5. Chứng từ chờ duyệt
    const pendingInvoices = await prisma.invoice.count({
      where: { companyId, approvalStatus: "PENDING", deletedAt: null }
    });
    const pendingCosts = await prisma.costRecord.count({
      where: { companyId, approvalStatus: "PENDING", deletedAt: null }
    });
    const pendingAdvances = await prisma.advanceRequest.count({
      where: { companyId, status: "SUBMITTED", deletedAt: null }
    });
    const pendingSettlements = await prisma.advanceSettlement.count({
      where: { companyId, status: "SUBMITTED", deletedAt: null }
    });

    const pendingApprovals = pendingInvoices + pendingCosts + pendingAdvances + pendingSettlements;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      receivables,
      payables,
      outstandingAdvances,
      cashIn,
      cashOut,
      netCashflow,
      pendingApprovals,
      riskAlerts: 0 // Will be calculated in detailed report
    };
  }

  /**
   * B. Báo cáo Hiệu quả Dự án (Project Profitability)
   */
  static async getProjectProfitability(filters: ReportFilters) {
    const { companyId } = filters;
    
    // Fetch all active projects
    const projects = await prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null }
        }
      }
    });

    const result = [];

    for (const project of projects) {
      const projectId = project.id;
      
      const contractValue = project.contracts.reduce((sum, c) => sum + Number(c.currentValue), 0);

      // Revenue & AR
      const invoices = await prisma.invoice.findMany({
        where: { companyId, projectId, approvalStatus: "APPROVED", deletedAt: null },
        select: { amount: true, remainingAmount: true }
      });
      const revenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const receivable = invoices.reduce((sum, inv) => sum + Number(inv.remainingAmount), 0);
      const collected = revenue - receivable;

      // Cost
      const costs = await prisma.costRecord.findMany({
        where: { companyId, projectId, approvalStatus: "APPROVED", deletedAt: null },
        select: { amount: true }
      });
      const cost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

      // Advances
      const advances = await prisma.advanceRequest.findMany({
        where: { companyId, projectId, status: { in: ["APPROVED", "PARTIALLY_SETTLED"] }, deletedAt: null },
        select: { remainingAmount: true }
      });
      const advanceOutstanding = advances.reduce((sum, a) => sum + Number(a.remainingAmount), 0);

      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Assume total budget is contract value or static budget if exists
      const totalBudget = Number(project.totalBudget || contractValue);
      const budgetUsage = totalBudget > 0 ? (cost / totalBudget) * 100 : 0;

      let riskLevel = "LOW";
      if (profit < 0) riskLevel = "HIGH";
      else if (budgetUsage > 90) riskLevel = "MEDIUM";

      result.push({
        projectId: project.id,
        projectName: project.name,
        contractValue,
        revenue,
        collected,
        receivable,
        cost,
        advanceOutstanding,
        profit,
        profitMargin,
        budgetUsage,
        riskLevel
      });
    }

    return result.sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * C. Quản trị Công nợ (Debt Management)
   */
  static async getDebtManagement(filters: ReportFilters) {
    const { companyId } = filters;
    const now = new Date();

    const invoices = await prisma.invoice.findMany({
      where: { 
        companyId, 
        approvalStatus: "APPROVED",
        remainingAmount: { gt: 0 },
        deletedAt: null 
      },
      include: {
        contract: true
      }
    });

    let totalAR = 0;
    const agingBuckets = {
      notDue: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      over90: 0
    };

    const overdueInvoices = [];

    for (const inv of invoices) {
      const remaining = Number(inv.remainingAmount);
      totalAR += remaining;

      if (!inv.dueDate || inv.dueDate >= now) {
        agingBuckets.notDue += remaining;
      } else {
        const diffTime = Math.abs(now.getTime() - inv.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) agingBuckets.days1_30 += remaining;
        else if (diffDays <= 60) agingBuckets.days31_60 += remaining;
        else if (diffDays <= 90) agingBuckets.days61_90 += remaining;
        else agingBuckets.over90 += remaining;

        overdueInvoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          remainingAmount: remaining,
          daysOverdue: diffDays,
          contractName: inv.contract?.title || "N/A"
        });
      }
    }

    // Sort overdue by days descending
    overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Simulated AP from unpaid costs
    const unpaidCosts = await prisma.costRecord.findMany({
      where: {
        companyId,
        status: "unpaid",
        approvalStatus: "APPROVED",
        deletedAt: null
      },
      select: { amount: true }
    });
    const totalAP = unpaidCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);

    return {
      arTotal: totalAR,
      apTotal: totalAP,
      agingBuckets,
      overdueInvoices: overdueInvoices.slice(0, 10), // Top 10
    };
  }

  /**
   * D. Báo cáo Dòng tiền (Cashflow Summary)
   */
  static async getCashflowSummary(filters: ReportFilters) {
    const { companyId } = filters;

    const companyProjects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true }
    });
    const projectIds = companyProjects.map(p => p.id);

    const payments = await prisma.payment.findMany({
      where: { projectId: { in: projectIds }, approvalStatus: "APPROVED", deletedAt: null },
      select: { amount: true, date: true }
    });
    
    const paidCosts = await prisma.costRecord.findMany({
      where: { companyId, status: "paid", deletedAt: null },
      select: { amount: true, date: true }
    });

    let cashIn = 0;
    let cashOut = 0;
    const monthlyData: Record<string, { in: number, out: number }> = {};

    payments.forEach(p => {
      const amt = Number(p.amount);
      const date = p.date || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { in: 0, out: 0 };
      }

      cashIn += amt;
      monthlyData[monthKey].in += amt;
    });
    
    paidCosts.forEach(p => {
      const amt = Number(p.amount);
      const date = p.date || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { in: 0, out: 0 };
      }

      cashOut += amt;
      monthlyData[monthKey].out += amt;
    });

    const netCashflow = cashIn - cashOut;
    
    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    const periods = sortedMonths.map(month => ({
      period: month,
      cashIn: monthlyData[month].in,
      cashOut: monthlyData[month].out,
      net: monthlyData[month].in - monthlyData[month].out
    }));

    return {
      cashIn,
      cashOut,
      netCashflow,
      periods
    };
  }

  /**
   * E. Cảnh báo Rủi ro (Risk Alerts)
   */
  static async getRiskAlerts(filters: ReportFilters) {
    const { companyId } = filters;
    const now = new Date();
    const alerts = [];

    // 1. Overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        remainingAmount: { gt: 0 },
        dueDate: { lt: now },
        deletedAt: null,
        approvalStatus: "APPROVED"
      },
      select: { id: true, invoiceNumber: true, remainingAmount: true, dueDate: true }
    });

    for (const inv of overdueInvoices) {
      const diffDays = Math.ceil((now.getTime() - inv.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        severity: diffDays > 60 ? "HIGH" : diffDays > 30 ? "MEDIUM" : "LOW",
        module: "INVOICE",
        documentId: inv.id,
        documentNo: inv.invoiceNumber || inv.id,
        amount: Number(inv.remainingAmount),
        daysOverdue: diffDays,
        reason: "Hóa đơn quá hạn chưa thu tiền",
        action: `/revenue?invoiceId=${inv.id}`
      });
    }

    // 2. Overdue Advances (assume 30 days is standard)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const overdueAdvances = await prisma.advanceRequest.findMany({
      where: {
        companyId,
        remainingAmount: { gt: 0 },
        createdAt: { lt: thirtyDaysAgo },
        status: { in: ["APPROVED", "PARTIALLY_SETTLED"] },
        deletedAt: null
      },
      select: { id: true, advanceNo: true, remainingAmount: true, createdAt: true }
    });

    for (const adv of overdueAdvances) {
      const diffDays = Math.ceil((now.getTime() - adv.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        severity: diffDays > 60 ? "HIGH" : "MEDIUM",
        module: "ADVANCE",
        documentId: adv.id,
        documentNo: adv.advanceNo || adv.id,
        amount: Number(adv.remainingAmount),
        daysOverdue: diffDays,
        reason: "Tạm ứng quá hạn hoàn ứng (>30 ngày)",
        action: `/settings?tab=advance&id=${adv.id}`
      });
    }

    // Sort by severity (HIGH > MEDIUM > LOW) and days overdue
    const severityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    alerts.sort((a, b) => {
      if (severityRank[b.severity] !== severityRank[a.severity]) {
        return severityRank[b.severity] - severityRank[a.severity];
      }
      return b.daysOverdue - a.daysOverdue;
    });

    return alerts.slice(0, 50); // Limit to top 50
  }
}
