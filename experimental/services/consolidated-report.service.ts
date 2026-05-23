import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class ConsolidatedReportService {
  static async getGroupSummary(companyId: string) {
    const [branches, projects, costs, invoices] = await Promise.all([
      prisma.branch.findMany({ where: { companyId } }),
      prisma.project.findMany({ where: { companyId } }),
      prisma.costRecord.findMany({ where: { companyId, deletedAt: null } }),
      prisma.invoice.findMany({ where: { companyId, deletedAt: null } })
    ]);

    const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
    const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);

    const branchSummary = branches.map(b => {
      const bProjects = projects.filter(p => p.branchId === b.id);
      const bCosts = costs.filter(c => c.branchId === b.id);
      
      return {
        branchId: b.id,
        name: b.name,
        projectCount: bProjects.length,
        totalCost: round(bCosts.reduce((s, c) => s + Number(c.amount), 0)),
        profitability: bProjects.length > 0 ? "STABLE" : "N/A"
      };
    });

    return {
      companyId,
      totalProjects: projects.length,
      totalBudget: round(totalBudget),
      totalCost: round(totalCost),
      totalRevenue: round(totalRevenue),
      overallMargin: totalRevenue > 0 ? round((totalRevenue - totalCost) / totalRevenue * 100, 2) : 0,
      branchSummary
    };
  }
}
