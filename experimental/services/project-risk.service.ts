import { prisma } from "@/lib/prisma";
import { ForecastService } from "./forecast.service";
import { ProjectHealthService } from "./project-health.service";

export class ProjectRiskService {
  static async getProjectRiskScore(projectId: string) {
    let score = 0;
    const factors: string[] = [];

    const [project, forecast, overdue, health] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      ForecastService.getProjectForecast(projectId),
      prisma.invoice.findMany({
        where: { projectId, remainingAmount: { gt: 0 }, dueDate: { lt: new Date() }, deletedAt: null }
      }),
      ProjectHealthService.getProjectPerformance(projectId)
    ]);

    if (!project || !health) return null;

    if (health.CPI < 0.9) {
      score += 20;
      factors.push("Low Cost Performance (CPI)");
    }
    if (health.SPI < 0.85) {
      score += 20;
      factors.push("Schedule Delay (SPI)");
    }
    if (overdue.length > 0) {
      score += 30;
      factors.push("Overdue Receivable Debt");
    }
    if (forecast.vac < 0) {
      score += 15;
      factors.push("Budget Overrun Projection (VAC)");
    }

    let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (score >= 60) level = "CRITICAL";
    else if (score >= 40) level = "HIGH";
    else if (score >= 20) level = "MEDIUM";

    return {
      projectId,
      score,
      level,
      factors
    };
  }
}
