import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";
import { ProjectHealthService } from "../project-health.service";

export class ForecastEngineService {
  static async getLiquidityRunway(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) throw new Error("Project not found");

    const totalDays = project.startDate && project.endDate 
      ? (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24)
      : 365;

    const health = await ProjectHealthService.getProjectPerformance(projectId);
    if (!health) throw new Error("Could not calculate performance metrics");

    const actualCost = health.AC;
    // Calculate burn rate per day
    const daysPassed = project.startDate 
      ? Math.max(1, (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 3600 * 24))
      : 30;

    const dailyBurnRate = round(actualCost / daysPassed, 2);

    // Get current cash balance for project/company
    const bank = await prisma.bankAccount.findFirst();
    const cashBalance = bank ? Number(bank.balance) : 100000000; // fallback if no bank

    const daysToInsolvency = dailyBurnRate > 0 ? round(cashBalance / dailyBurnRate, 1) : 999;

    return {
      dailyBurnRate,
      cashBalance,
      daysToInsolvency,
      runwayMonths: dailyBurnRate > 0 ? round((cashBalance / dailyBurnRate) / 30, 1) : 12
    };
  }

  static async getRollingCashForecast(projectId: string) {
    // 30/60/90 Days forecast
    // Cash Inflow: Invoices due in next 30/60/90 days (weighted by probability)
    // Cash Outflow: CostRecords unpaid and due in next 30/60/90 days

    const now = new Date();
    const date30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const date60 = new Date(now.getTime() + 60 * 24 * 3600 * 1000);
    const date90 = new Date(now.getTime() + 90 * 24 * 3600 * 1000);

    const invoices = await prisma.invoice.findMany({
      where: { projectId, deletedAt: null, remainingAmount: { gt: 0 } }
    });

    const unpaidCosts = await prisma.costRecord.findMany({
      where: { projectId, deletedAt: null, status: "unpaid" }
    });

    const getInflowForPeriod = (end: Date) => {
      return invoices
        .filter(inv => !inv.dueDate || inv.dueDate <= end)
        .reduce((sum, inv) => {
          const isOverdue = inv.dueDate && inv.dueDate < now;
          const prob = isOverdue ? 0.4 : 0.8; // Overdue invoices have lower probability
          return sum + Number(inv.remainingAmount) * prob;
        }, 0);
    };

    const getOutflowForPeriod = (end: Date) => {
      // For construction ERP AP, we assume they are due within the period
      return unpaidCosts
        .filter(c => c.date <= end)
        .reduce((sum, c) => sum + Number(c.amount), 0);
    };

    return {
      forecast30: {
        inflow: round(getInflowForPeriod(date30)),
        outflow: round(getOutflowForPeriod(date30)),
        net: round(getInflowForPeriod(date30) - getOutflowForPeriod(date30))
      },
      forecast60: {
        inflow: round(getInflowForPeriod(date60)),
        outflow: round(getOutflowForPeriod(date60)),
        net: round(getInflowForPeriod(date60) - getOutflowForPeriod(date60))
      },
      forecast90: {
        inflow: round(getInflowForPeriod(date90)),
        outflow: round(getOutflowForPeriod(date90)),
        net: round(getInflowForPeriod(date90) - getOutflowForPeriod(date90))
      }
    };
  }

  static async getRiskCorrelation(projectId: string) {
    const health = await ProjectHealthService.getProjectPerformance(projectId);
    const runway = await this.getLiquidityRunway(projectId);

    if (!health) throw new Error("Could not calculate health");

    // Detect cascades:
    // Low SPI (< 0.85) -> Delay in certified progress -> Delayed collections -> Negative Runway -> AP default risk
    const alerts = [];
    let stressScore = 0;

    if (health.SPI < 0.85) {
      stressScore += 30;
      alerts.push({
        severity: "CRITICAL",
        message: `TRỄ TIẾN ĐỘ: Chỉ số SPI sụt giảm dưới 0.85 (${health.SPI}). Nguy cơ chậm tiến độ nghiệm thu gây tắc nghẽn dòng tiền.`
      });
    }

    if (health.CPI < 0.90) {
      stressScore += 25;
      alerts.push({
        severity: "WARNING",
        message: `VƯỢT NGÂN SÁCH: Chỉ số CPI đạt ${health.CPI}. Có dấu hiệu xói mòn lợi nhuận định mức.`
      });
    }

    if (runway.daysToInsolvency < 60) {
      stressScore += 45;
      alerts.push({
        severity: "CRITICAL",
        message: `RỦI RO THANH KHOẢN: Dòng tiền dự phòng chỉ còn đủ cho ${runway.daysToInsolvency} ngày hoạt động.`
      });
    }

    // Trigger Notification records
    const users = await prisma.user.findMany({
      where: { role: { in: ["CFO", "ADMIN"] } }
    });

    for (const user of users) {
      for (const alert of alerts) {
        // Avoid duplicate alerts in same day
        const existing = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            message: alert.message,
            createdAt: { gte: new Date(new Date().getTime() - 24 * 3600 * 1000) }
          }
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: alert.severity === "CRITICAL" ? "CẢNH BÁO KHẨN CẤP" : "CẢNH BÁO RỦI RO",
              message: alert.message,
              type: "TREASURY_ALERT",
              severity: alert.severity,
              priority: alert.severity === "CRITICAL" ? 2 : 1
            }
          });
        }
      }
    }

    return {
      stressScore,
      level: stressScore >= 70 ? "CRITICAL" : stressScore >= 40 ? "HIGH" : "MEDIUM",
      alerts
    };
  }
}
