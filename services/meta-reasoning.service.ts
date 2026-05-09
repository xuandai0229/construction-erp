import { ForecastService } from "./forecast.service";
import { ProjectRiskService } from "./project-risk.service";

export class MetaReasoningService {
  /**
   * Evaluates the integrity and confidence of the project's intelligence outputs.
   */
  static async evaluateIntelligence(projectId: string) {
    const [forecast, risk] = await Promise.all([
      ForecastService.getProjectForecast(projectId),
      ProjectRiskService.getProjectRiskScore(projectId)
    ]);

    let integrityScore = 100;
    const flags: string[] = [];

    // 1. Consistency Check: High Risk but High CPI?
    if (risk && risk.score > 60 && forecast.cpi > 1.1) {
      integrityScore -= 30;
      flags.push("REASONING_CONFLICT: High risk score detected despite excellent cost performance.");
    }

    // 2. Confidence Check: Low data points
    if (forecast.bac === 0) {
      integrityScore -= 50;
      flags.push("LOW_CONFIDENCE: Budget is zero, forecast calculations are unreliable.");
    }

    return {
      projectId,
      integrityScore,
      flags,
      status: integrityScore > 70 ? "STABLE" : "UNSTABLE",
      timestamp: new Date()
    };
  }
}
