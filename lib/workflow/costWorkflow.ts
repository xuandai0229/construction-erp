import { WorkflowTransitionError } from "../errors";

export type CostWorkflowState = "DRAFT" | "PENDING_PM" | "PENDING_FINANCE" | "PENDING_DIRECTOR" | "APPROVED" | "POSTED" | "REVERSED" | "REJECTED";

export const ALLOWED_TRANSITIONS: Record<CostWorkflowState, CostWorkflowState[]> = {
  DRAFT: ["PENDING_PM", "PENDING_FINANCE"],
  PENDING_PM: ["PENDING_FINANCE", "REJECTED"],
  PENDING_FINANCE: ["APPROVED", "PENDING_DIRECTOR", "REJECTED"],
  PENDING_DIRECTOR: ["APPROVED", "REJECTED"],
  APPROVED: ["POSTED", "REVERSED"],
  POSTED: ["REVERSED"],
  REVERSED: [],
  REJECTED: ["DRAFT"] // Can be resubmitted
};

export class CostWorkflow {
  static validateTransition(currentStatus: string, nextStatus: CostWorkflowState) {
    const currentState = currentStatus as CostWorkflowState;
    const allowed = ALLOWED_TRANSITIONS[currentState] || [];
    
    if (!allowed.includes(nextStatus)) {
      throw new WorkflowTransitionError(currentStatus, `chuyển sang ${nextStatus}`);
    }
    return true;
  }
}
