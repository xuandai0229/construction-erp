import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/event-bus";
import { AuditService } from "../audit.service";
import { LoggerService } from "../logger.service";
import { UserRole, ApprovalStatus, ProjectStatus, ProcurementStatus, ContractStatus } from "../../generated/prisma-client";
import { MetricsCollector } from "@/lib/metrics";

export type WorkflowType = "PROCUREMENT" | "PAYMENT" | "CONTRACT" | "CHANGE_REQUEST" | "PROJECT_PROGRESS";

export interface WorkflowTransitionContext {
  userId: string;
  companyId: string;
  role: UserRole;
  reason?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class WorkflowEngine {
  /**
   * 1. PROCUREMENT WORKFLOW DEFINITION
   * Flow: DRAFT -> SUBMITTED -> MANAGER_APPROVED -> PROCUREMENT_APPROVED -> APPROVED (CFO approved) -> ORDERED -> RECEIVED
   */
  private static procurementTransitions: Record<string, string[]> = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["ORDERED", "CANCELLED"],
    ORDERED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [],
    REJECTED: ["DRAFT"],
    CANCELLED: []
  };

  /**
   * 2. PAYMENT WORKFLOW DEFINITION
   * Flow: DRAFT -> SENT -> PAID
   */
  private static paymentTransitions: Record<string, string[]> = {
    DRAFT: ["SENT"],
    SENT: ["PAID", "REJECTED", "CANCELLED"],
    PAID: [],
    REJECTED: ["DRAFT"],
    CANCELLED: []
  };

  /**
   * 3. CONTRACT WORKFLOW DEFINITION
   * Flow: DRAFT -> ACTIVE -> COMPLETED -> TERMINATED
   */
  private static contractTransitions: Record<string, string[]> = {
    DRAFT: ["ACTIVE"],
    ACTIVE: ["COMPLETED", "TERMINATED"],
    COMPLETED: [],
    TERMINATED: []
  };

  /**
   * 4. CHANGE REQUEST (VARIATION ORDER) WORKFLOW DEFINITION
   * Flow: DRAFT -> APPROVED -> CANCELLED
   */
  private static changeTransitions: Record<string, string[]> = {
    DRAFT: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: [],
    REJECTED: ["DRAFT"],
    CANCELLED: []
  };

  /**
   * 5. PROJECT PROGRESS WORKFLOW DEFINITION
   * Flow: PLANNED -> IN_PROGRESS -> DELAYED -> COMPLETED -> CLOSED
   */
  private static projectTransitions: Record<string, string[]> = {
    PLANNED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["DELAYED", "COMPLETED", "CANCELLED"],
    DELAYED: ["IN_PROGRESS", "CANCELLED"],
    COMPLETED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: []
  };

  /**
   * Validates if a transition is allowed.
   */
  static isValidTransition(type: WorkflowType, from: string, to: string): boolean {
    const transitions = this.getTransitionsForType(type);
    return transitions[from]?.includes(to) ?? false;
  }

  private static getTransitionsForType(type: WorkflowType): Record<string, string[]> {
    switch (type) {
      case "PROCUREMENT": return this.procurementTransitions;
      case "PAYMENT": return this.paymentTransitions;
      case "CONTRACT": return this.contractTransitions;
      case "CHANGE_REQUEST": return this.changeTransitions;
      case "PROJECT_PROGRESS": return this.projectTransitions;
    }
  }

  /**
   * Executes a transactionally-safe workflow transition.
   */
  static async transition(
    type: WorkflowType,
    entityId: string,
    toState: string,
    context: WorkflowTransitionContext
  ) {
    const startTime = Date.now();
    LoggerService.info(`[WorkflowEngine] Attempting transition for ${type} entity ${entityId} to ${toState}`, {
      userId: context.userId,
      role: context.role
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch current state of target entity and verify multi-tenant isolation
        const current = await this.fetchEntityState(tx, type, entityId, context.companyId);
        if (!current) {
          throw new Error(`Entity ${entityId} not found or tenant boundary violated.`);
        }

        const fromState = current.state;

        // 2. Validate state machine transition logic
        if (!this.isValidTransition(type, fromState, toState)) {
          throw new Error(`Invalid state transition from ${fromState} to ${toState} for workflow ${type}.`);
        }

        // 3. Enforce Role/RBAC privileges for specific transition steps
        await this.enforceTransitionPermissions(context.role, type, toState);

        // 4. Update the Database entity with the new state
        const updated = await this.updateEntityState(tx, type, entityId, toState, context);

        // 5. Write an immutable, detailed Audit Log
        await AuditService.log({
          userId: context.userId,
          action: "UPDATE",
          entity: type,
          entityId,
          oldData: { status: fromState },
          newData: { status: toState },
          reason: context.reason ?? `Workflow transition to ${toState}`,
          severity: "INFO",
          correlationId: context.correlationId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        });

        // 6. Publish Event Bus Domain Events for asynchronous downstream consumers
        await this.publishWorkflowEvents(type, entityId, fromState, toState, context);

        return updated;
      });

      const elapsed = Date.now() - startTime;
      MetricsCollector.recordWorkflowTransition(elapsed);
      return result;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      MetricsCollector.recordWorkflowTransition(elapsed);
      throw err;
    }
  }

  /**
   * Fetches the entity details and extracts its current status.
   */
  private static async fetchEntityState(tx: any, type: WorkflowType, id: string, companyId: string) {
    switch (type) {
      case "PROCUREMENT": {
        const pr = await tx.purchaseRequest.findFirst({
          where: { id, deletedAt: null, projectId: { not: "" } }
        });
        return pr ? { state: pr.status } : null;
      }
      case "PAYMENT": {
        const inv = await tx.invoice.findFirst({
          where: { id, deletedAt: null, companyId }
        });
        return inv ? { state: inv.approvalStatus } : null;
      }
      case "CONTRACT": {
        const contract = await tx.contract.findFirst({
          where: { id, deletedAt: null }
        });
        return contract ? { state: contract.status } : null;
      }
      case "CHANGE_REQUEST": {
        const vo = await tx.variationOrder.findFirst({
          where: { id }
        });
        return vo ? { state: vo.status } : null;
      }
      case "PROJECT_PROGRESS": {
        const proj = await tx.project.findFirst({
          where: { id, companyId, deletedAt: null }
        });
        return proj ? { state: proj.status } : null;
      }
    }
  }

  /**
   * Updates the core DB status of the transition entity.
   */
  private static async updateEntityState(tx: any, type: WorkflowType, id: string, toState: string, context: WorkflowTransitionContext) {
    switch (type) {
      case "PROCUREMENT":
        return await tx.purchaseRequest.update({
          where: { id },
          data: { status: toState as ProcurementStatus }
        });
      case "PAYMENT":
        return await tx.invoice.update({
          where: { id },
          data: { approvalStatus: toState as ApprovalStatus }
        });
      case "CONTRACT":
        return await tx.contract.update({
          where: { id },
          data: { status: toState as ContractStatus }
        });
      case "CHANGE_REQUEST":
        return await tx.variationOrder.update({
          where: { id },
          data: { status: toState as ApprovalStatus }
        });
      case "PROJECT_PROGRESS":
        return await tx.project.update({
          where: { id },
          data: { status: toState as ProjectStatus }
        });
    }
  }

  /**
   * Enforces strict RBAC validations for crucial workflow transition milestones.
   */
  private static async enforceTransitionPermissions(role: UserRole, type: WorkflowType, toState: string) {
    // 1. Procurement flow controls
    if (type === "PROCUREMENT") {
      if (toState === "APPROVED" && role !== "CFO" && role !== "SUPER_ADMIN" && role !== "ADMIN") {
        throw new Error("CFO signoff or Admin authorization is required for final procurement approval.");
      }
    }

    // 2. Payment flow controls
    if (type === "PAYMENT") {
      if (toState === "PAID" && role !== "ACCOUNTANT" && role !== "CFO" && role !== "SUPER_ADMIN") {
        throw new Error("Only Accountants, CFO, or Admin can mark invoices as paid.");
      }
    }

    // 3. Contract approval controls
    if (type === "CONTRACT") {
      if (toState === "ACTIVE" && role !== "BRANCH_DIRECTOR" && role !== "GROUP_DIRECTOR" && role !== "SUPER_ADMIN") {
        throw new Error("Only Directors can authorize contracts.");
      }
    }
  }

  /**
   * Publishes Domain Events to the centralized Event Bus on transition completion.
   */
  private static async publishWorkflowEvents(
    type: WorkflowType,
    entityId: string,
    from: string,
    to: string,
    context: WorkflowTransitionContext
  ) {
    let eventType = "";
    const payload = { entityId, fromState: from, toState: to, reason: context.reason };

    if (type === "PROCUREMENT") {
      if (to === "SUBMITTED") eventType = "PurchaseRequested";
      else if (to === "APPROVED") eventType = "PurchaseApproved";
      else if (to === "ORDERED") eventType = "VendorAssigned";
      else if (to === "RECEIVED") eventType = "GoodsReceived";
    } else if (type === "PAYMENT") {
      if (to === "SENT") eventType = "InvoiceCreated";
      else if (to === "PAID") eventType = "InvoicePaid";
    } else if (type === "CONTRACT") {
      if (to === "ACTIVE") eventType = "ContractSigned";
    } else if (type === "CHANGE_REQUEST") {
      if (to === "APPROVED") eventType = "BudgetAdjustmentApproved";
    } else if (type === "PROJECT_PROGRESS") {
      if (to === "DELAYED") eventType = "ProjectDelayed";
      else if (to === "COMPLETED") eventType = "MilestoneCompleted";
    }

    if (eventType) {
      await eventBus.publish({
        type: eventType,
        payload,
        metadata: {
          userId: context.userId,
          companyId: context.companyId
        }
      });
    }
  }

  /**
   * Automatically scans for workflows that have breached approval SLAs (escalation rules).
   */
  static async checkEscalationRules() {
    LoggerService.info("[WorkflowEngine] Executing cron check for SLA breaches & auto-escalations.");
    const pendingRequests = await prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { ApprovalStep: true, Project: true }
    });

    const SLA_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours SLA threshold

    for (const req of pendingRequests) {
      const activeStep = req.ApprovalStep.find(s => s.status === "PENDING");
      if (activeStep) {
        const age = Date.now() - new Date(activeStep.createdAt).getTime();
        if (age > SLA_LIMIT_MS) {
          LoggerService.warn(`[Escalation Breach] Request ${req.id} active step ${activeStep.id} breached 24h SLA. Triggering auto-escalation.`);

          // Escalate step automatically
          await prisma.approvalStep.update({
            where: { id: activeStep.id },
            data: { comment: `[Auto-Escalated due to SLA Breach after 24h]`, updatedAt: new Date() }
          });

          await eventBus.publish({
            type: "KPIThresholdExceeded",
            payload: { requestId: req.id, stepId: activeStep.id, alert: "SLA_BREACH" },
            metadata: { projectId: req.projectId }
          });
        }
      }
    }
  }
}
