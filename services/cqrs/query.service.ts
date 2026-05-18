import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { ReadModelProjector } from "./read-model.projector";

export class CQRSQueryService {
  /**
   * Get Cashflow Summary for a tenant (CASHFLOW_SUMMARY read model)
   */
  static async getCashflowSummary(companyId: string) {
    const modelId = `${companyId}:CASHFLOW_SUMMARY:global`;
    
    try {
      let model = await prisma.readModel.findUnique({
        where: { id: modelId }
      });

      if (!model) {
        LoggerService.warn(`[CQRS Query] Read model ${modelId} not found. Triggering on-demand rebuild...`);
        await ReadModelProjector.rebuild(companyId);
        model = await prisma.readModel.findUnique({
          where: { id: modelId }
        });
      }

      return model ? model.data : { totalInvoiced: 0, totalPaid: 0, cashflowTrend: [] };
    } catch (err) {
      LoggerService.error(`[CQRS Query] Failed to fetch cashflow summary for tenant ${companyId}:`, { error: err });
      return { totalInvoiced: 0, totalPaid: 0, cashflowTrend: [] };
    }
  }

  /**
   * Get Project Insights (PROJECT_INSIGHTS read model)
   */
  static async getProjectInsights(companyId: string, projectId: string) {
    const modelId = `${companyId}:PROJECT_INSIGHTS:${projectId}`;

    try {
      let model = await prisma.readModel.findUnique({
        where: { id: modelId }
      });

      if (!model) {
        LoggerService.warn(`[CQRS Query] Read model ${modelId} not found. Triggering on-demand rebuild...`);
        await ReadModelProjector.rebuild(companyId);
        model = await prisma.readModel.findUnique({
          where: { id: modelId }
        });
      }

      return model ? model.data : { totalCommittedCosts: 0, budgetVariance: 0, prCount: 0 };
    } catch (err) {
      LoggerService.error(`[CQRS Query] Failed to fetch project insights for ${projectId}:`, { error: err });
      return { totalCommittedCosts: 0, budgetVariance: 0, prCount: 0 };
    }
  }

  /**
   * Get Executive KPI Summary (EXECUTIVE_KPI read model)
   */
  static async getExecutiveKPI(companyId: string) {
    const modelId = `${companyId}:EXECUTIVE_KPI:global`;

    try {
      let model = await prisma.readModel.findUnique({
        where: { id: modelId }
      });

      if (!model) {
        LoggerService.warn(`[CQRS Query] Read model ${modelId} not found. Triggering on-demand rebuild...`);
        await ReadModelProjector.rebuild(companyId);
        model = await prisma.readModel.findUnique({
          where: { id: modelId }
        });
      }

      return model ? model.data : { anomaliesCount: 0, highestRiskScore: 0, projectRisks: {}, eventCounters: {} };
    } catch (err) {
      LoggerService.error(`[CQRS Query] Failed to fetch executive KPIs for tenant ${companyId}:`, { error: err });
      return { anomaliesCount: 0, highestRiskScore: 0, projectRisks: {}, eventCounters: {} };
    }
  }
}
