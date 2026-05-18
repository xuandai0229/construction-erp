import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "./financial-aggregation.service";
import { round } from "@/lib/math";
import { ReportingService } from "./reporting.service";
import { ProjectService } from "./project.service";
import { DiagnosticsService } from "./diagnostics.service";
import { CacheService } from "./cache.service";
import { OperationalService } from "./operational.service";
import { ActionCenterService } from "./action-center.service";

export class DashboardService {
  static async getExecutiveKPIs(projectId?: string, companyId?: string | null, userId?: string) {
    const cacheKey = projectId 
      ? `dashboard:kpis:${projectId}` 
      : (companyId ? `dashboard:kpis:global:${companyId}` : "dashboard:kpis:global");
    
    return CacheService.wrap(cacheKey, async () => {
      const [projects, invoices, costs, riskProfiles] = await Promise.all([
        prisma.project.findMany({ where: { deletedAt: null, ...(companyId && { companyId }) } }),
        prisma.invoice.findMany({ where: { deletedAt: null, ...(projectId && { projectId }), ...(companyId && { companyId }) } }),
        prisma.costRecord.findMany({ where: { deletedAt: null, ...(projectId && { projectId }), ...(companyId && { companyId }) } }),
        ReportingService.getProjectRiskProfiles(companyId)
      ]);

      const snapshot = projectId 
        ? await FinancialAggregationService.getProjectSnapshot(projectId)
        : null;

      const totalInvoiced = snapshot ? snapshot.reality.totalRevenue : invoices.reduce((s, i) => s + (["APPROVED", "POSTED", "PAID", "PARTIAL"].includes(i.status) ? Number(i.amount) : 0), 0);
      const totalCost = snapshot ? snapshot.reality.actualCost : costs.reduce((s, c) => s + (["APPROVED", "POSTED", "LOCKED"].includes(c.workflowStatus || c.approvalStatus) ? Number(c.amount) : 0), 0);
      const grossMargin = totalInvoiced > 0 ? ((totalInvoiced - totalCost) / totalInvoiced) * 100 : 0;

      // Aging & Collection Intelligence
      const aging = await ReportingService.getReceivableAging(projectId, companyId);
      const totalOverdue = aging.reduce((s, b) => s + b.amount, 0);

      // Operational Governance Alerts
      const health = await DiagnosticsService.systemHealthCheck();
      const governanceAlerts = (health.integrity.length || 0) + (health.orphans.length || 0);

      // Budget Intelligence
      const overBudgetCount = riskProfiles.filter(p => p.summary.costOverrunPct > 100).length;

      // Executive Narrative & Scorecard
      const narrative = await ReportingService.getExecutiveNarrative(projectId, companyId);
      const scorecard = await ReportingService.getManagementScorecard(companyId);

      return {
        financials: {
          totalInvoiced: round(totalInvoiced),
          totalCost: round(totalCost),
          grossMarginPct: round(grossMargin, 2),
          totalOverdue: round(totalOverdue),
        },
        portfolio: {
          activeProjects: projects.length,
          atRiskProjects: riskProfiles.filter(p => p.riskScore > 40).length,
          overBudgetProjects: overBudgetCount,
        },
        governance: {
          healthScore: Math.max(0, 100 - (governanceAlerts * 10)),
          activeAlerts: governanceAlerts,
          integrityIssues: health.integrity.length,
          orphanJournals: health.orphans.length
        },
        executiveSummary: {
          narrative,
          scorecard,
          topRisks: riskProfiles.slice(0, 3).map(r => ({
            ...r,
            ux: OperationalService.getProjectRiskGuidance(r)
          })),
          actionCenter: (await ActionCenterService.getUserTasks(userId || "system_internal_admin", projectId)).slice(0, 5),
          recentActivities: await prisma.activityFeed.findMany({
            where: { 
              ...(projectId && { projectId }),
              ...(companyId && { companyId })
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { User: { select: { name: true } } }
          })
        },
        agingReport: aging
      };
    }, 30000); // 30 sec cache for KPIs
  }
}
