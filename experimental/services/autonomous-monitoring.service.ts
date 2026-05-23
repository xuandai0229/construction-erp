import { ProjectHealthService } from "./project-health.service";
import { AnomalyDetectionService } from "./anomaly-detection.service";
import { WorkflowCoordinator } from "./workflow-coordinator";

export class AutonomousMonitoringService {
  /**
   * Performs an autonomous audit of all active projects.
   */
  static async performSystemAudit(projectId: string) {
    const health = await ProjectHealthService.getProjectPerformance(projectId);
    const anomalies = await AnomalyDetectionService.detectAnomalies(projectId);

    const alerts: string[] = [];

    if (health && (health.CPI < 0.8 || health.SPI < 0.8)) {
      alerts.push(`CRITICAL: Performance degradation detected (CPI: ${health.CPI}, SPI: ${health.SPI})`);
      await WorkflowCoordinator.startInvestigation(projectId, "PERFORMANCE_DEGRADATION");
    }

    const criticalAnomalies = anomalies.filter(a => a.severity === "HIGH");
    if (criticalAnomalies.length > 0) {
      alerts.push(`CRITICAL: ${criticalAnomalies.length} high-severity anomalies detected.`);
      await WorkflowCoordinator.startInvestigation(projectId, "ANOMALY_ESCALATION");
    }

    return {
      projectId,
      healthStatus: health?.healthStatus,
      alerts,
      timestamp: new Date()
    };
  }
}
