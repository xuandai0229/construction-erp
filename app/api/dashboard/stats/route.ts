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

    // Global stats across all projects for main dashboard
    const [projectCount, activeProjectCount, costAgg, budgetAgg, revenueAgg, invoiceAgg, costsByType] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.costRecord.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
      prisma.budgetRecord.aggregate({ where: { deletedAt: null }, _sum: { estimatedAmount: true } }),
      prisma.revenue.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { deletedAt: null }, _sum: { amount: true, paidAmount: true, remainingAmount: true } }),
      prisma.costRecord.groupBy({ by: ["costType"], where: { deletedAt: null }, _sum: { amount: true } })
    ]);

    const totalInvoiced = Number(invoiceAgg._sum?.amount || 0);
    const totalRevenue = totalInvoiced; // Accrual Revenue
    const totalCost = Number(costAgg._sum?.amount || 0);
    const totalBudget = Number(budgetAgg._sum?.estimatedAmount || 0);
    const totalCollected = Number(invoiceAgg._sum?.paidAmount || 0);
    const totalReceivable = Number(invoiceAgg._sum?.remainingAmount || 0);
    
    const costByType: Record<string, number> = {};
    costsByType.forEach(c => {
      costByType[c.costType] = Number(c._sum?.amount || 0);
    });

    return successResponse({
      global: {
        totalProjects: projectCount,
        activeProjects: activeProjectCount,
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
