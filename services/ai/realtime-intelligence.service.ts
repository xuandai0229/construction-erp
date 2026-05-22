import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { CQRSQueryService } from "../cqrs/query.service";
import { eventBus } from "@/lib/event-bus";

export interface AnomalyReport {
  projectId: string;
  riskScore: number; // 0 - 100
  anomalies: string[];
  recommendations: string[];
  timestamp: string;
}

export class RealtimeIntelligenceService {
  /**
   * Analyzes project risks deterministically based on real-time event streams and CQRS read models
   */
  static async analyzeProjectRisk(projectId: string, companyId: string): Promise<AnomalyReport> {
    LoggerService.info(`[AI Intelligence] Analyzing project risk boundaries for project ${projectId} under tenant ${companyId}`);

    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    try {
      // 1. Fetch denormalized project insights from CQRS read model
      const insights: any = await CQRSQueryService.getProjectInsights(companyId, projectId);
      
      // 2. Fetch project details
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      if (!project) {
        throw new Error(`Project ${projectId} not found.`);
      }

      const totalBudget = Number(project.totalBudget || 0);
      const committedCosts = Number(insights?.totalCommittedCosts || 0);
      const budgetVariance = Number(insights?.budgetVariance || 0);

      // Rule 1: committed cost threshold check
      if (totalBudget > 0) {
        const costRatio = committedCosts / totalBudget;
        if (costRatio > 0.9) {
          riskScore += 40;
          anomalies.push(`Committed costs have breached 90% of total budget limit (Ratio: ${(costRatio * 100).toFixed(1)}%).`);
          recommendations.push("Initiate strict expenditure cap on procurement requests immediately.");
        } else if (costRatio > 0.7) {
          riskScore += 20;
          anomalies.push(`Committed costs are elevated, crossing 70% of total budget limit.`);
          recommendations.push("Perform active budget audit before approving future procurement drafts.");
        }
      }

      // Rule 2: variation order cost spike check
      if (budgetVariance > 0) {
        const varianceRatio = budgetVariance / (totalBudget || 1);
        if (varianceRatio > 0.15) {
          riskScore += 30;
          anomalies.push(`Approved variation orders have increased total project budget by over 15% (Ratio: ${(varianceRatio * 100).toFixed(1)}%).`);
          recommendations.push("Escalate variation orders review to branch directors to prevent cost expansion.");
        }
      }

      // Rule 3: historical event anomaly scan (SLA breach count checks)
      const escalationCount = await prisma.domainEvent.count({
        where: {
          projectId,
          type: "KPIThresholdExceeded",
          payload: {
            path: ["alert"],
            equals: "SLA_BREACH"
          }
        }
      });

      if (escalationCount > 3) {
        riskScore += 20;
        anomalies.push(`Detected recurrent SLA breaches on approval tasks (Breaches: ${escalationCount}).`);
        recommendations.push("Optimize approval workflows chain or delegate authority levels to clear bottlenecks.");
      }

      // Clamp risk score at 100
      riskScore = Math.min(100, riskScore);

      const report: AnomalyReport = {
        projectId,
        riskScore,
        anomalies: anomalies.length > 0 ? anomalies : ["No anomalies detected."],
        recommendations: recommendations.length > 0 ? recommendations : ["Maintain active monitoring routine."],
        timestamp: new Date().toISOString()
      };

      // 3. Persist the AI Analysis results back to a dedicated CQRS Read Model for immediate retrieval
      const modelId = `${companyId}:ANOMALY_SUMMARY:${projectId}`;
      await prisma.readModel.upsert({
        where: { id: modelId },
        update: { data: report as any, version: { increment: 1 } },
        create: {
          id: modelId,
          companyId,
          type: "ANOMALY_SUMMARY",
          data: report as any,
          version: 1
        }
      });

      // 4. If risks are high, dispatch alert event on the Event Bus
      if (riskScore >= 50) {
        await eventBus.publish({
          type: "AnomaliesDetected",
          payload: {
            projectId,
            riskScore,
            anomalyCount: anomalies.length
          },
          metadata: { companyId, projectId }
        });
      }

      return report;
    } catch (err) {
      LoggerService.error(`[AI Intelligence] Risk scanning failed for project ${projectId}:`, { error: err });
      throw err;
    }
  }
}
