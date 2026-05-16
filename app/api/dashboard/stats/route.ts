import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (projectId) {
      // Get detailed stats for a specific project from authoritative service
      const stats = await ProjectService.getAccountingSummary(projectId);
      return successResponse(stats);
    }

    // Global stats across all projects for main dashboard
    // Hardening: Use a consistent logic for global aggregation
    const [projectCount, activeProjectCount, costsAgg, budgetsAgg, invoicesAgg, costsByType] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: { in: ['ACTIVE', 'IN_PROGRESS'] } } }),
      prisma.costRecord.aggregate({ 
        where: { deletedAt: null, approvalStatus: "APPROVED" }, 
        _sum: { amount: true } 
      }),
      prisma.budgetRecord.aggregate({ 
        where: { deletedAt: null }, 
        _sum: { estimatedAmount: true } 
      }),
      prisma.invoice.aggregate({ 
        where: { deletedAt: null, status: { in: ["SENT", "PAID", "PARTIAL", "OVERDUE"] } }, 
        _sum: { amount: true, paidAmount: true, remainingAmount: true } 
      }),
      prisma.costRecord.groupBy({ 
        by: ["costType"], 
        where: { deletedAt: null, approvalStatus: "APPROVED" }, 
        _sum: { amount: true } 
      })
    ]);

    const totalRevenue = Number(invoicesAgg._sum?.amount || 0);
    const totalCost = Number(costsAgg._sum?.amount || 0);
    const totalBudget = Number(budgetsAgg._sum?.estimatedAmount || 0);
    const totalCollected = Number(invoicesAgg._sum?.paidAmount || 0);
    const totalReceivable = Number(invoicesAgg._sum?.remainingAmount || 0);
    
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
          totalInvoiced: totalRevenue,
          totalCollected,
          totalReceivable
        }
      },
      // Global snapshot version (based on last update across all financial entities)
      version: `v_global_${Date.now()}` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
