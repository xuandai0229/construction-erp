import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Get detailed stats for a specific project
      const stats = await ProjectService.getAccountingSummary(projectId);
      return successResponse(stats);
    }

    // Global stats across all projects for main dashboard
    const [projects, costs, budgets, revenues, invoices] = await Promise.all([
      prisma.project.findMany({ where: { deletedAt: null } }),
      prisma.costRecord.findMany({ select: { amount: true, cost_type: true } }),
      prisma.budgetRecord.findMany({ select: { estimated_amount: true } }),
      prisma.revenue.findMany({ select: { amount: true } }),
      prisma.invoice.findMany({ select: { amount: true, paid_amount: true, remaining_amount: true } }),
    ]);

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalCost = costs.reduce((s, c) => s + c.amount, 0);
    const totalBudget = budgets.reduce((s, b) => s + b.estimated_amount, 0);
    
    const costByType: Record<string, number> = {};
    costs.forEach(c => {
      costByType[c.cost_type] = (costByType[c.cost_type] || 0) + c.amount;
    });

    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paid_amount, 0);
    const totalReceivable = invoices.reduce((s, i) => s + i.remaining_amount, 0);

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
