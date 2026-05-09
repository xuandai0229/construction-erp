import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";
import { ProjectHealthService } from "./project-health.service";

export class ForecastService {
  static async getProjectForecast(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) throw new Error("Project not found");

    const health = await ProjectHealthService.getProjectPerformance(projectId);
    if (!health) throw new Error("Performance data unavailable");

    const bac = Number(project.totalBudget);
    const cpi = health.CPI > 0 ? health.CPI : 1;
    
    // EAC = BAC / CPI
    const eac = bac / cpi;
    const etc = eac - Number(health.AC);
    const varianceAtCompletion = bac - eac;

    return {
      projectId,
      bac: round(bac),
      eac: round(eac),
      etc: round(etc),
      vac: round(varianceAtCompletion),
      cpi: round(cpi, 2),
      spi: round(health.SPI, 2),
      status: varianceAtCompletion < 0 ? "OVER_BUDGET" : "UNDER_BUDGET"
    };
  }
}
