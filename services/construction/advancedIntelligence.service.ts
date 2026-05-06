import { prisma } from "@/lib/prisma";
import { WIPService } from "./wip.service";
import { CommittedCostService } from "./committedCost.service";
import { InventoryService } from "./inventory.service";

export class AdvancedIntelligenceService {
  /**
   * The "Executive Dashboard" data generator.
   */
  static async getExecutiveSummary(projectId: string) {
    const [basicWIP, committed, materials] = await Promise.all([
      WIPService.getProjectFinancials(projectId),
      CommittedCostService.getCommittedCostAnalysis(projectId),
      prisma.material.findMany({ select: { id: true, name: true } })
    ]);

    // Material Waste Analysis
    const materialVariances = await Promise.all(
      materials.slice(0, 10).map(m => InventoryService.getMaterialVariance(projectId, m.id))
    );

    const totalBudget = basicWIP.summary.totalBudget;
    const actualCost = basicWIP.summary.actualCost;
    const earnedValue = basicWIP.summary.earnedValue;
    const committedCost = committed.analysis.totalCommitted;

    // EAC (Estimate At Completion) = Actual Cost + (Remaining Budget / CPI)
    const cpi = basicWIP.intelligence.cpi;
    const remainingBudget = totalBudget - earnedValue;
    const estimateToComplete = cpi > 0 ? remainingBudget / cpi : remainingBudget;
    const estimateAtCompletion = actualCost + estimateToComplete;

    return {
        projectId,
        financialStatus: {
            budget: totalBudget,
            committed: committedCost,
            actual: actualCost,
            earned: earnedValue,
            forecastAtCompletion: estimateAtCompletion,
            varianceAtCompletion: totalBudget - estimateAtCompletion
        },
        riskMetrics: {
            marginErosion: estimateAtCompletion > totalBudget,
            overCommitment: committedCost > totalBudget,
            cpiStatus: cpi < 1 ? "OVER_BUDGET" : "UNDER_BUDGET",
            wipStatus: basicWIP.intelligence.wipStatus
        },
        materialReconciliation: materialVariances,
        timestamp: new Date()
    };
  }
}
