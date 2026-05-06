import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class PortfolioControlService {
  /**
   * PHẢI PHÂN TÍCH: Scale từ 1 -> 100+ projects
   * Aggregates health metrics across the entire project portfolio.
   */
  static async getPortfolioHealth() {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        wbsItems: { select: { budgetAmount: true } },
        journalEntries: { 
            include: { lines: true }
        }
      }
    });

    return projects.map(p => {
      const totalBudget = p.totalBudget || new Decimal(0);
      const totalActual = p.journalEntries.reduce((acc, entry) => {
        // Simple logic: Sum of expense account debits
        return acc.add(entry.lines.filter(l => l.type === "DEBIT").reduce((s, l) => s.add(l.amount), new Decimal(0)));
      }, new Decimal(0));

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        budgetUtilization: totalBudget.gt(0) ? totalActual.div(totalBudget).mul(100).toNumber() : 0,
        riskLevel: this.calculateRiskLevel(p, totalActual, totalBudget),
        governanceScore: 0 // Will be populated by GovernanceScoreService
      };
    });
  }

  private static calculateRiskLevel(project: any, actual: Decimal, budget: Decimal) {
    if (actual.gt(budget)) return "CRITICAL";
    if (actual.gt(budget.mul(0.9))) return "HIGH";
    return "STABLE";
  }

  /**
   * Cross-project risk heatmap data
   */
  static async getRiskHeatmap() {
    // Aggregates risks by region/category/type
    // For now, group by status
    const stats = await prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { contractValue: true }
    });
    return stats;
  }
}

export class GovernanceScoreService {
  /**
   * Measures Operational Consistency and Governance Compliance.
   */
  static async calculateProjectScore(projectId: string) {
    // 1. Check for manual bypasses (from Audit Logs)
    const bypasses = await prisma.auditLog.count({
      where: { projectId, action: "BYPASS_ATTEMPT" }
    });

    // 2. Check for WBS structure consistency (Standard vs Actual)
    // 3. Check for mandatory approvals
    const pendingApprovals = await prisma.approvalRequest.count({
      where: { projectId, status: "PENDING", createdAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } }
    });

    let score = 100;
    score -= (bypasses * 10);
    score -= (pendingApprovals * 5);
    
    return Math.max(0, score);
  }
}
