
import { prisma } from "../lib/prisma";
import { round } from "../lib/math";
import { ProjectService } from "./project.service";
import { CacheService } from "./cache.service";

export interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

export class ReportingService {
  /**
   * Generates a Receivable Aging Report for a project or the entire company
   */
  static async getReceivableAging(projectId?: string): Promise<AgingBucket[]> {
    const today = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        remainingAmount: { gt: 0 },
        ...(projectId && { projectId })
      }
    });

    const buckets = [
      { bucket: "0-30 days", amount: 0, count: 0, minDays: 0, maxDays: 30 },
      { bucket: "31-60 days", amount: 0, count: 0, minDays: 31, maxDays: 60 },
      { bucket: "61-90 days", amount: 0, count: 0, minDays: 61, maxDays: 90 },
      { bucket: "90+ days", amount: 0, count: 0, minDays: 91, maxDays: 9999 }
    ];

    for (const inv of invoices) {
      const dueDate = inv.dueDate || inv.issuedDate;
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = today > dueDate;

      if (!isOverdue) {
        // Current receivables (not yet overdue) are in 0-30 bucket normally,
        // but for an aging report, we only bucket overdue ones OR distinguish them.
        // Let's bucket OVERDUE days.
        continue; 
      }

      const bucket = buckets.find(b => diffDays >= b.minDays && diffDays <= b.maxDays);
      if (bucket) {
        bucket.amount += Number(inv.remainingAmount);
        bucket.count++;
      }
    }

    return buckets.map(({ bucket, amount, count }) => ({ bucket, amount: round(amount), count }));
  }

  /**
   * Project Portfolio Risk Assessment
   */
  static async getProjectRiskProfiles() {
    return CacheService.wrap("reporting:risk_profiles", async () => {
      const projects = await prisma.project.findMany({ where: { deletedAt: null } });
      const profiles = [];

    for (const p of projects) {
      const summary = await ProjectService.getAccountingSummary(p.id);
      
      let riskScore = 0;
      const riskFlags: string[] = [];

      // 1. Budget Risk
      if (summary.isCostOverrun) {
        riskScore += 40;
        riskFlags.push(`Vượt ngân sách: ${round(summary.costOverrunPct - 100, 1)}%`);
      } else if (summary.costOverrunPct > 90) {
        riskScore += 15;
        riskFlags.push("Sắp vượt ngân sách (>90%)");
      }

      // 2. Collection Risk
      if (summary.overdueInvoices > 0) {
        riskScore += 30;
        riskFlags.push(`Có ${summary.overdueInvoices} hóa đơn quá hạn`);
      }

      // 3. Operational Risk (Reversals)
      const reversalCount = await prisma.journalEntry.count({
        where: { projectId: p.id, isReversed: true }
      });
      if (reversalCount > 5) {
        riskScore += 20;
        riskFlags.push(`Tần suất hủy chứng từ cao (${reversalCount})`);
      }

      profiles.push({
        projectId: p.id,
        projectName: p.name,
        riskScore: Math.min(100, riskScore),
        severity: riskScore > 70 ? "CRITICAL" : riskScore > 40 ? "HIGH" : riskScore > 20 ? "MEDIUM" : "LOW",
        flags: riskFlags,
        summary: {
          profitMargin: summary.profitMargin,
          costOverrunPct: summary.costOverrunPct,
          receivables: summary.totalRemainingInvoice
        }
      });
    }

    return profiles.sort((a, b) => b.riskScore - a.riskScore);
    }, 60000); // 1 min cache for risk profiles
  }

  /**
   * Cash Flow Forecast
   */
  static async getCashFlowForecast(projectId?: string) {
    const summary = await ProjectService.getAccountingSummary(projectId || ""); // If empty, gets all? No, ProjectService needs an ID.
    // We'll aggregate across all projects if no ID.
    
    const invoices = await prisma.invoice.findMany({
      where: { deletedAt: null, remainingAmount: { gt: 0 }, ...(projectId && { projectId }) },
      orderBy: { dueDate: 'asc' }
    });

    const forecast = {
      expectedCollections: invoices.map(i => ({
        date: i.dueDate || i.issuedDate,
        amount: Number(i.remainingAmount),
        source: i.invoiceNumber || i.id
      })),
      totalExpected: invoices.reduce((s, i) => s + Number(i.remainingAmount), 0)
    };

    return forecast;
  }

  /**
   * Enterprise Management Scorecard
   */
  static async getManagementScorecard() {
    const [riskProfiles, aging] = await Promise.all([
      this.getProjectRiskProfiles(),
      this.getReceivableAging()
    ]);

    const totalOverdue = aging.reduce((s, b) => s + b.amount, 0);
    const avgRiskScore = riskProfiles.reduce((s, p) => s + p.riskScore, 0) / (riskProfiles.length || 1);
    
    // Scores are 0-100 (Higher is Better)
    const scores = {
      financialHealth: Math.max(0, 100 - (totalOverdue / 10000000)), // Deduct for every 10M overdue
      budgetDiscipline: Math.max(0, 100 - riskProfiles.filter(p => p.summary.costOverrunPct > 100).length * 20),
      collectionEfficiency: Math.max(0, 100 - aging.filter(b => b.bucket === "90+ days").length * 25),
      operationalStability: Math.max(0, 100 - (avgRiskScore))
    };

    return {
      scores,
      overallHealth: round(Object.values(scores).reduce((s, v) => s + v, 0) / 4),
      status: avgRiskScore < 30 ? "STABLE" : avgRiskScore < 60 ? "WARNING" : "CRITICAL"
    };
  }

  /**
   * Generates Executive Narrative for the Monthly Report
   */
  static async getExecutiveNarrative(projectId?: string) {
    const summary = projectId ? await ProjectService.getAccountingSummary(projectId) : null;
    const risks = await this.getProjectRiskProfiles();
    const critical = risks.filter(p => p.severity === "CRITICAL" || p.severity === "HIGH");

    let narrative = "Hệ thống ERP ghi nhận tình trạng vận hành ổn định. ";
    
    if (critical.length > 0) {
      narrative += `Cần lưu ý ${critical.length} dự án có rủi ro cao về ngân sách hoặc thu hồi công nợ. `;
    }

    if (summary && summary.isCostOverrun) {
      narrative += `Dự án hiện tại đang vượt định mức ngân sách ${round(summary.costOverrunPct - 100, 1)}%. `;
    }

    return narrative;
  }

  /**
   * Generates a flat Monthly Financial Summary for Export
   */
  static async getMonthlyFinancialSummary() {
    const projects = await prisma.project.findMany({ where: { deletedAt: null } });
    const report = [];

    for (const p of projects) {
      const s = await ProjectService.getAccountingSummary(p.id);
      report.push({
        "Mã Dự Án": p.id.slice(0, 8),
        "Tên Dự Án": p.name,
        "Giá Trị Hợp Đồng": s.totalRevenue,
        "Ngân Sách": s.totalBudget,
        "Chi Phí Thực Tế": s.totalCost,
        "Lợi Nhuận": s.profit,
        "Biên Lợi Nhuận (%)": round(s.profitMargin, 2),
        "Tình Trạng": s.isCostOverrun ? "VƯỢT NGÂN SÁCH" : "BÌNH THƯỜNG",
        "Công Nợ Quá Hạn": s.totalRemainingInvoice
      });
    }

    return report;
  }
}
