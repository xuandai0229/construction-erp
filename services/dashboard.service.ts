import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class DashboardService {
  static async getExecutiveKPIs(projectId?: string) {
    const [projects, invoices, costs] = await Promise.all([
      prisma.project.findMany({ where: { deletedAt: null } }),
      prisma.invoice.findMany({ where: { deletedAt: null, ...(projectId && { projectId }) } }),
      prisma.costRecord.findMany({ where: { deletedAt: null, ...(projectId && { projectId }) } })
    ]);

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
    const grossMargin = totalInvoiced > 0 ? ((totalInvoiced - totalCost) / totalInvoiced) * 100 : 0;

    // Burn rate (Cost per month for last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentCosts = costs.filter(c => c.date >= threeMonthsAgo);
    const burnRate = recentCosts.reduce((s, c) => s + Number(c.amount), 0) / 3;

    return {
      totalInvoiced,
      totalCost,
      grossMargin: round(grossMargin, 2),
      burnRate: round(burnRate, 0),
      projectCount: projects.length,
      overdueInvoices: invoices.filter(i => i.status === "OVERDUE").length,
      healthScore: 85 // Mock score
    };
  }
}
