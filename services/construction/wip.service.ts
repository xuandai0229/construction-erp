import { prisma } from "@/lib/prisma";

export class WIPService {
  /**
   * Comprehensive Project Financial Intelligence
   */
  static async getProjectFinancials(projectId: string) {
    // 1. Get Basic Stats (Budget, Cost, Revenue)
    const [costSummary, budgetSummary] = await Promise.all([
      prisma.costRecord.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.budgetRecord.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true },
      }),
    ]);
    const stats = {
      totalCost: Number(costSummary._sum.amount || 0),
      totalBudget: Number(budgetSummary._sum.estimatedAmount || 0),
    };

    // 2. Get Earned Value (Verified Progress)
    const progress = await prisma.progressEntry.aggregate({
      where: {
        boqItem: { projectId },
        status: "VERIFIED"
      },
      _sum: { amount: true, quantity: true }
    });

    const earnedValue = Number(progress._sum.amount || 0);

    // 3. Get Billed Revenue (Invoiced)
    const billed = await prisma.invoice.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { amount: true, retentionAmount: true }
    });

    const billedRevenue = Number(billed._sum.amount || 0);
    const retention = Number(billed._sum.retentionAmount || 0);

    // 4. Calculations
    // WIP (Asset) = Work Done but not yet billed
    // If billed > earnedValue, it's a liability (Overbilling)
    const wipValue = earnedValue - billedRevenue;
    
    // Performance Factor (CPI) = Earned Value / Actual Cost
    const actualCost = stats.totalCost;
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1;

    // Cost to Complete (Forecast)
    // Basic: (Total Budget - Earned Value) / CPI
    const totalBudget = stats.totalBudget;
    const costToComplete = cpi > 0 ? (totalBudget - earnedValue) / cpi : (totalBudget - earnedValue);

    return {
      projectId,
      currency: "VND",
      summary: {
        totalBudget: stats.totalBudget,
        actualCost: stats.totalCost,
        earnedValue: earnedValue,
        billedRevenue: billedRevenue,
        retentionHeld: retention,
      },
      intelligence: {
        wipStatus: wipValue >= 0 ? "UNDERBILLED" : "OVERBILLED",
        wipValue: Math.abs(wipValue),
        cpi: Number(cpi.toFixed(2)),
        forecastCostAtCompletion: actualCost + costToComplete,
        estimatedMargin: stats.totalBudget - (actualCost + costToComplete),
      }
    };
  }
}
