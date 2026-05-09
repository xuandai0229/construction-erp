import { eventBus, EnterpriseEvent } from "../lib/event-bus";
import { WorkflowCoordinator } from "./workflow-coordinator";
import { AuditService } from "./audit.service";

export class SelfHealingWorkflowService {
  static init() {
    console.log("[SelfHealing] Initializing adaptive recovery listeners...");

    // Listen for anomalies
    eventBus.subscribe("ANOMALY_DETECTED", async (event) => {
      console.log(`[SelfHealing] Processing anomaly: ${event.payload.type}`);
      
      // Auto-initiate investigation if high severity
      if (event.payload.severity === "HIGH") {
        await WorkflowCoordinator.startInvestigation(
          event.metadata.projectId || "",
          event.payload.type
        );
      }
    });

    // Listen for stuck workflows (Placeholder for interval check)
    eventBus.subscribe("WORKFLOW_STUCK", async (event) => {
      console.warn(`[SelfHealing] RECOVERY INITIATED for stuck workflow: ${event.payload.workflowId}`);
      
      await AuditService.log({
        userId: "SYSTEM",
        action: "UPDATE",
        entity: "WorkflowRecovery",
        entityId: event.payload.workflowId,
        newData: { status: "RECOVERY_STARTED" }
      });
      
      // Re-trigger the workflow
      WorkflowCoordinator.setWorkflowState(event.payload.workflowId, "ANALYZING");
    });
  }

  static async triggerManualHealing(workflowId: string) {
    eventBus.publish({
      type: "WORKFLOW_STUCK",
      payload: { workflowId },
      metadata: {}
    });
  }
}
