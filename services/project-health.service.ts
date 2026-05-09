import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class ProjectHealthService {
  static async getProjectPerformance(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { BOQItem: true }
    });

    if (!project) return null;

    const [costsAgg, progressAgg] = await Promise.all([
      prisma.costRecord.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.progressEntry.aggregate({
        where: { boqItemId: { in: project.BOQItem.map(i => i.id) }, status: "APPROVED" },
        _sum: { amount: true }
      })
    ]);

    const AC = Number(costsAgg._sum?.amount || 0); // Actual Cost
    const EV = Number(progressAgg._sum?.amount || 0); // Earned Value
    const BAC = Number(project.totalBudget); // Budget at Completion

    // Calculate Planned Value (PV)
    let PV = 0;
    if (project.startDate && project.endDate) {
      const now = new Date();
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      
      const progressRatio = Math.max(0, Math.min(1, daysPassed / totalDays));
      PV = BAC * progressRatio;
    }

    const CPI = AC > 0 ? EV / AC : 1;
    const SPI = PV > 0 ? EV / PV : 1;

    return {
      CPI: round(CPI, 2),
      SPI: round(SPI, 2),
      EV: round(EV, 0),
      AC: round(AC, 0),
      PV: round(PV, 0),
      CV: round(EV - AC, 0), // Cost Variance
      SV: round(EV - PV, 0), // Schedule Variance
      healthStatus: this.getHealthStatus(CPI, SPI)
    };
  }

  private static getHealthStatus(CPI: number, SPI: number) {
    if (CPI >= 0.95 && SPI >= 0.95) return "EXCELLENT";
    if (CPI >= 0.85 && SPI >= 0.85) return "GOOD";
    if (CPI < 0.75 || SPI < 0.75) return "CRITICAL";
    return "WARNING";
  }
}
