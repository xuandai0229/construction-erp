import { ProjectRiskService } from "./project-risk.service";
import { ForecastService } from "./forecast.service";
import { AnomalyDetectionService } from "./anomaly-detection.service";

export class SemanticQueryEngine {
  /**
   * Maps natural language intents to internal service calls.
   * This is the "Grounding" layer.
   */
  static async executeIntent(intent: string, params: { projectId: string }) {
    const { projectId } = params;

    switch (intent) {
      case "RISK_ANALYSIS":
        // Import correct service (ProjectRiskService is in project-risk.service.ts)
        const { ProjectRiskService } = await import("./project-risk.service");
        return ProjectRiskService.getProjectRiskScore(projectId);
      
      case "COST_FORECAST":
        return ForecastService.getProjectForecast(projectId);

      case "ANOMALY_CHECK":
        return AnomalyDetectionService.detectAnomalies(projectId);

      default:
        throw new Error(`Unsupported semantic intent: ${intent}`);
    }
  }
}
