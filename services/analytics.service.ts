import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class AnalyticsService {
  /**
   * Aggregates costs and revenues by month for a specific company or branch.
   */
  static async getFinancialTrend(options: { companyId?: string; branchId?: string; months?: number }) {
    const { companyId, branchId, months = 12 } = options;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const [costs, revenues] = await Promise.all([
      prisma.costRecord.groupBy({
        by: ['date'],
        where: {
          companyId,
          branchId,
          date: { gte: startDate },
          deletedAt: null
        },
        _sum: { amount: true }
      }),
      prisma.invoice.groupBy({
        by: ['issuedDate'],
        where: {
          companyId,
          branchId,
          issuedDate: { gte: startDate },
          deletedAt: null
        },
        _sum: { amount: true }
      })
    ]);

    // Format into monthly buckets
    const trendMap: Record<string, { cost: number; revenue: number }> = {};
    
    costs.forEach(c => {
      const month = c.date.toISOString().substring(0, 7);
      if (!trendMap[month]) trendMap[month] = { cost: 0, revenue: 0 };
      trendMap[month].cost += Number(c._sum.amount || 0);
    });

    revenues.forEach(r => {
      const month = r.issuedDate.toISOString().substring(0, 7);
      if (!trendMap[month]) trendMap[month] = { cost: 0, revenue: 0 };
      trendMap[month].revenue += Number(r._sum.amount || 0);
    });

    return Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        cost: round(values.cost),
        revenue: round(values.revenue),
        margin: values.revenue > 0 ? round((values.revenue - values.cost) / values.revenue * 100, 2) : 0
      }));
  }
}
