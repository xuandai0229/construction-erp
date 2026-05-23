import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class ExecutiveAnalyticsService {
  static async getExecutiveDashboard(companyId: string) {
    const [projects, branches, overdueDebt, totalRetention] = await Promise.all([
      prisma.project.findMany({ where: { companyId } }),
      prisma.branch.findMany({ where: { companyId } }),
      prisma.invoice.aggregate({
        where: { companyId, remainingAmount: { gt: 0 }, dueDate: { lt: new Date() }, deletedAt: null },
        _sum: { remainingAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { companyId, retentionAmount: { gt: 0 }, deletedAt: null },
        _sum: { retentionAmount: true }
      })
    ]);

    const activeProjects = projects.filter(p => p.status === 'ACTIVE');
    const projectHealth = {
      critical: projects.filter(p => p.status === 'ACTIVE' && Number(p.totalBudget) > 0).length, // Placeholder for real health check
      excellent: 0,
      warning: 0
    };

    return {
      kpis: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        totalOverdue: round(Number(overdueDebt._sum.remainingAmount || 0)),
        totalRetention: round(Number(totalRetention._sum.retentionAmount || 0)),
      },
      branchPerformance: branches.map(b => ({
        id: b.id,
        name: b.name,
        projectCount: projects.filter(p => p.branchId === b.id).length
      })),
      timestamp: new Date()
    };
  }
}
