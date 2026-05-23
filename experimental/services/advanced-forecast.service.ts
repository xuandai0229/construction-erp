import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";
import { ProjectHealthService } from "./project-health.service";

export class AdvancedForecastService {
  /**
   * Advanced EAC calculation with weighting for recent performance.
   */
  static async getAdvancedProjectForecast(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    const health = await ProjectHealthService.getProjectPerformance(projectId);
    if (!health) throw new Error("Performance data missing");

    const bac = Number(project.totalBudget);
    const cpi = health.CPI;
    const spi = health.SPI;

    // EAC (Estimate At Completion) - Case 1: Performance continues at same rate
    const eac_standard = bac / (cpi || 1);
    
    // EAC - Case 2: Schedule also impacts cost (CPI * SPI)
    const eac_weighted = Number(health.AC) + ((bac - Number(health.EV)) / (cpi * spi || 1));

    // Confidence Interval (Simple standard deviation approach placeholder)
    const variance = Math.abs(eac_standard - eac_weighted);
    const confidence = variance / eac_standard < 0.1 ? "HIGH" : "MEDIUM";

    return {
      projectId,
      bac: round(bac),
      eac_best_case: round(Math.min(eac_standard, eac_weighted)),
      eac_worst_case: round(Math.max(eac_standard, eac_weighted)),
      eac_most_likely: round((eac_standard + eac_weighted) / 2),
      confidence,
      healthStatus: health.healthStatus
    };
  }
}
