import { AnomalyDetectionService } from "./anomaly-detection.service";
import { ProjectHealthService } from "./project-health.service";

export class EnterpriseCausalReasoningService {
  /**
   * Analyzes the potential root causes of a performance drop.
   */
  static async explainPerformanceDrop(projectId: string) {
    const health = await ProjectHealthService.getProjectPerformance(projectId);
    const anomalies = await AnomalyDetectionService.detectAnomalies(projectId);
    
    const causalChain: string[] = [];

    if (health && health.CPI < 0.9) {
      causalChain.push("Symptom: Low Cost Performance (CPI < 0.9)");
      
      const spikes = anomalies.filter(a => a.type === "COST_SPIKE");
      if (spikes.length > 0) {
        causalChain.push(`Direct Cause: ${spikes.length} Cost Spikes detected`);
      }

      const duplicates = anomalies.filter(a => a.type === "DUPLICATE_PAYMENT_RISK");
      if (duplicates.length > 0) {
        causalChain.push(`Secondary Cause: Potential accounting errors (Duplicate Payments)`);
      }
    }

    return {
      projectId,
      causalChain,
      conclusion: causalChain.length > 0 ? "Performance drop is likely data-driven by specific anomalies." : "Inconclusive.",
      timestamp: new Date()
    };
  }
}
