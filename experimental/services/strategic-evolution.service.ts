import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class StrategicEvolutionService {
  /**
   * Calculates the operational maturity score of the enterprise.
   */
  static async calculateMaturity(companyId: string) {
    const [projects, logs] = await Promise.all([
      prisma.project.findMany({ where: { companyId } }),
      prisma.auditLog.count({ where: { action: "UPDATE" } })
    ]);

    const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
    const projectMaturity = activeCount > 0 ? (logs / activeCount) : 0; // Logs per project as proxy for control

    // Scale 1-10
    const maturityScore = Math.min(10, round(projectMaturity / 100, 1));
    
    let level = "FOUNDATION";
    if (maturityScore >= 8) level = "ADAPTIVE";
    else if (maturityScore >= 5) level = "OPERATIONAL";

    return {
      companyId,
      maturityScore,
      level,
      timestamp: new Date()
    };
  }
}
