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
    const [projects, costs, budgets, revenues, invoices] = await Promise.all([
      prisma.project.findMany({ where: { deletedAt: null } }),
      prisma.costRecord.findMany({ select: { amount: true, costType: true } }),
      prisma.budgetRecord.findMany({ select: { estimatedAmount: true } }),
      prisma.revenue.findMany({ select: { amount: true } }),
      prisma.invoice.findMany({ select: { amount: true, paidAmount: true, remainingAmount: true } }),
    ]);

    const totalRevenue = revenues.reduce((s, r) => s + Number(r.amount), 0);
    const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
    const totalBudget = budgets.reduce((s, b) => s + Number(b.estimatedAmount), 0);
    
    const costByType: Record<string, number> = {};
    costs.forEach(c => {
      costByType[c.costType] = (costByType[c.costType] || 0) + Number(c.amount);
    });

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    const totalReceivable = invoices.reduce((s, i) => s + Number(i.remainingAmount), 0);

    return successResponse({
      global: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length,
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
