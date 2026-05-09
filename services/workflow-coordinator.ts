export type WorkflowState = "IDLE" | "ANALYZING" | "ESCALATING" | "RECONCILING" | "COMPLETED" | "FAILED";

export class WorkflowCoordinator {
  private static workflowStates = new Map<string, WorkflowState>();

  static setWorkflowState(workflowId: string, state: WorkflowState) {
    console.log(`[WorkflowCoordinator] Workflow ${workflowId} changed to ${state}`);
    this.workflowStates.set(workflowId, state);
  }

  static getWorkflowState(workflowId: string): WorkflowState {
    return this.workflowStates.get(workflowId) || "IDLE";
  }

  /**
   * Orchestrates a multi-step investigation.
   */
  static async startInvestigation(projectId: string, anomalyType: string) {
    const workflowId = `WF-${Date.now()}`;
    this.setWorkflowState(workflowId, "ANALYZING");
    
    // Simulate steps
    setTimeout(() => this.setWorkflowState(workflowId, "ESCALATING"), 2000);
    setTimeout(() => this.setWorkflowState(workflowId, "COMPLETED"), 5000);

    return {
      workflowId,
      initialState: "ANALYZING",
      projectId,
      anomalyType
    };
  }
}
