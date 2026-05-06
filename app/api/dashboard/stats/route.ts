import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (projectId) {
      // Get detailed stats for a specific project
      const stats = await ProjectService.getAccountingSummary(projectId);
      return successResponse(stats);
    }

    // Global stats across all projects - Optimized with Aggregate/GroupBy
    const [
      projectCounts,
      costStats,
      costByTypeRaw,
      budgetStats,
      revenueStats,
      invoiceStats
    ] = await Promise.all([
      // Project Counts
      prisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true }
      }),
      // Total Cost
      prisma.costRecord.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      // Cost By Type
      prisma.costRecord.groupBy({
        by: ['costType'],
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      // Total Budget
      prisma.budgetRecord.aggregate({
        where: { deletedAt: null },
        _sum: { estimatedAmount: true }
      }),
      // Total Revenue
      prisma.revenue.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true }
      }),
      // Invoice Stats
      prisma.invoice.aggregate({
        where: { deletedAt: null },
        _sum: { 
          amount: true, 
          paidAmount: true, 
          remainingAmount: true 
        }
      })
    ]);

    const totalProjects = projectCounts.reduce((s, c) => s + c._count._all, 0);
    const activeProjects = projectCounts
      .filter(c => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS')
      .reduce((s, c) => s + c._count._all, 0);

    const totalRevenue = Number(revenueStats._sum.amount || 0);
    const totalCost = Number(costStats._sum.amount || 0);
    const totalBudget = Number(budgetStats._sum.estimatedAmount || 0);
    
    const costByType: Record<string, number> = {};
    costByTypeRaw.forEach(c => {
      costByType[c.costType] = Number(c._sum.amount || 0);
    });

    const totalInvoiced = Number(invoiceStats._sum.amount || 0);
    const totalCollected = Number(invoiceStats._sum.paidAmount || 0);
    const totalReceivable = Number(invoiceStats._sum.remainingAmount || 0);

    return successResponse({
      global: {
        totalProjects,
        activeProjects,
        totalRevenue,
        totalCost,
        totalBudget,
        profit: totalRevenue - totalCost,
        margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
        costByType,
        invoiceStats: {
          totalInvoiced,
          totalCollected,
          totalReceivable
        }
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
