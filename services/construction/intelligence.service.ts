import { prisma } from "@/lib/prisma";
import { CPMEngine } from "./cpm-engine.service";
import { ContractGovernanceService } from "./governance.service";
import { ForecastEngineService } from "../finance/forecast-engine.service";
import { ActivityStatus, ProjectStatus } from "@/generated/prisma-client";

/**
 * Construction Execution Intelligence
 * Aggregates CPM, Treasury, and Operations data for Executive Control.
 */
export class ExecutionIntelligenceService {
  
  static async getProjectHealth(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    // 1. SCHEDULE HEALTH (CPM)
    const scheduleVariance = await CPMEngine.getScheduleVariance(projectId);
    const spi = await this.calculateSPI(projectId);
    
    // 2. FINANCIAL HEALTH (CPI & Liquidity)
    const cpi = await this.calculateCPI(projectId);
    const rollingForecast = await ForecastEngineService.getRollingCashForecast(projectId);
    const runway = await ForecastEngineService.getLiquidityRunway(projectId);
    const obligations = await ContractGovernanceService.forecastObligations(projectId);
    
    // 3. EXECUTION RISK CORRELATION
    let scheduleRiskScore = 0;
    if (spi < 0.85) scheduleRiskScore += 40;
    if (scheduleVariance.criticalActivitiesDelayed > 0) scheduleRiskScore += 30;
    if (scheduleVariance.projectDelayDays > 14) scheduleRiskScore += 30;

    let liquidityRiskScore = 0;
    if (runway.daysToInsolvency < 15) liquidityRiskScore += 50;
    if (rollingForecast.forecast30.net < 0) liquidityRiskScore += 25;
    if (obligations.totalFutureObligations > runway.cashBalance) liquidityRiskScore += 25;

    // 4. OVERALL HEALTH STATUS
    const healthScore = 100 - (scheduleRiskScore * 0.5 + liquidityRiskScore * 0.5);
    let healthStatus = "HEALTHY";
    if (healthScore < 75) healthStatus = "WARNING";
    if (healthScore < 50) healthStatus = "CRITICAL";

    // 5. ALERT GENERATION
    const alerts: string[] = [];
    if (scheduleVariance.criticalActivitiesDelayed > 0) {
      alerts.push(`🚨 CRITICAL PATH DELAY: ${scheduleVariance.criticalActivitiesDelayed} công tác găng đang bị trễ.`);
    }
    if (spi < 0.85) {
      alerts.push(`⚠️ PRODUCTIVITY COLLAPSE: Hiệu suất thi công (SPI = ${spi.toFixed(2)}) ở mức báo động.`);
    }
    if (runway.daysToInsolvency < 7) {
      alerts.push(`💥 LIQUIDITY EXHAUSTION: Chỉ còn ${runway.daysToInsolvency} ngày trước khi mất thanh khoản.`);
    }
    if (obligations.totalFutureObligations > runway.cashBalance * 2) {
      alerts.push(`⚠️ OBLIGATION OVERHANG: Nghĩa vụ tương lai ($${obligations.totalFutureObligations}) gấp đôi quỹ tiền mặt hiện có.`);
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },
      health: {
        score: healthScore,
        status: healthStatus,
        spi: Number(spi.toFixed(2)),
        cpi: Number(cpi.toFixed(2)),
      },
      schedule: {
        projectDelayDays: scheduleVariance.projectDelayDays,
        criticalDelayed: scheduleVariance.criticalActivitiesDelayed,
      },
      treasury: {
        availableCash: runway.cashBalance,
        futureObligations: obligations.totalFutureObligations,
        runwayDays: runway.daysToInsolvency,
      },
      alerts,
    };
  }

  // SPI = Earned Value (EV) / Planned Value (PV)
  private static async calculateSPI(projectId: string): Promise<number> {
    const activities = await prisma.activity.findMany({
      where: { projectId, deletedAt: null }
    });

    let ev = 0; // Earned Value
    let pv = 0; // Planned Value
    const now = new Date();

    for (const act of activities) {
      // Simplified EV calculation based on duration
      const budget = act.plannedDuration * 1000000; // Mock budget rate
      
      ev += budget * (Number(act.percentComplete) / 100);

      if (act.plannedStart && act.plannedFinish) {
        if (now > act.plannedFinish) {
          pv += budget; // 100% planned by now
        } else if (now > act.plannedStart) {
          const totalDays = act.plannedDuration;
          const elapsed = (now.getTime() - act.plannedStart.getTime()) / (1000 * 3600 * 24);
          pv += budget * (elapsed / totalDays);
        }
      }
    }

    return pv === 0 ? 1.0 : ev / pv;
  }

  // CPI = Earned Value (EV) / Actual Cost (AC)
  private static async calculateCPI(projectId: string): Promise<number> {
    // Simplified Mock CPI
    return 0.95; // In reality, fetch from CostRecord aggregated sum
  }
}
