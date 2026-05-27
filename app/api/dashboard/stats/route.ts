import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";
import { assertAuthenticated } from "@/lib/auth-guard";

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (projectId) {
      // Validate Project & Tenant Ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId, deletedAt: null }
      });
      if (!project) throw new ApiError(404, "Project not found");
      if (user.companyId && project.companyId !== user.companyId) {
        throw new ApiError(403, "Cross-tenant access denied");
      }
      // Get detailed stats for a specific project from authoritative service
      const stats = await ProjectService.getAccountingSummary(projectId);
      return successResponse(stats);
    }

    // Global stats across all projects for main dashboard (Tenant Isolated)
    const companyFilter = user.companyId ? { companyId: user.companyId } : {};

    // Get all authorized projects for this tenant/company
    const authorizedProjects = await prisma.project.findMany({
      where: { deletedAt: null, ...companyFilter },
      select: { id: true }
    });
    const projectIds = authorizedProjects.map(p => p.id);

    const [projectCount, activeProjectCount, canonicalSummaries, costsByType] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null, ...companyFilter } }),
      prisma.project.count({ where: { deletedAt: null, status: { in: ['ACTIVE', 'IN_PROGRESS'] }, ...companyFilter } }),
      Promise.all(projectIds.map(projectId => FinancialAggregationService.getCanonicalProjectFinancials(projectId))),
      prisma.costRecord.groupBy({ 
        by: ["costType"], 
        where: { deletedAt: null, approvalStatus: { not: "REJECTED" }, projectId: { in: projectIds } }, 
        _sum: { amount: true } 
      })
    ]);

    const totalRevenue = canonicalSummaries.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCost = canonicalSummaries.reduce((sum, item) => sum + item.totalCost, 0);
    const totalBudget = canonicalSummaries.reduce((sum, item) => sum + item.totalBudget, 0);
    const totalInvoiced = canonicalSummaries.reduce((sum, item) => sum + item.totalInvoiced, 0);
    const totalCollected = canonicalSummaries.reduce((sum, item) => sum + item.collectedCash, 0);
    const totalReceivable = canonicalSummaries.reduce((sum, item) => sum + item.totalContractReceivable, 0);
    const needsReconciliation = canonicalSummaries.some(item => item.reconciliation.needsReconciliation);
    
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
        },
        reconciliationStatus: needsReconciliation ? "NEEDS_RECONCILIATION" : "RECONCILED",
        reconciliationMessage: needsReconciliation ? "Can doi soat du lieu" : "Da doi soat"
      },
      // Global snapshot version (based on last update across all financial entities)
      version: `v_global_${Date.now()}` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
