import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { eventBus } from "@/lib/event-bus";
import { AuditService } from "../audit.service";
import { MetricsCollector } from "@/lib/metrics";
import { UserRole } from "../../generated/prisma-client";

export interface WorkflowContext {
  userId: string;
  companyId: string;
  role: UserRole;
  reason?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  amount?: number; // Used for dynamic financial limits checking
}

export class DynamicWorkflowService {
  /**
   * Registers a new dynamic workflow definition for a tenant company
   */
  static async registerDefinition(companyId: string, entityType: string, name: string, definition: any) {
    LoggerService.info(`[Dynamic Workflow] Registering definition for tenant ${companyId}: ${name} (${entityType})`);
    
    // Deactivate previous active versions
    await prisma.workflowDefinition.updateMany({
      where: { companyId, entityType, isActive: true },
      data: { isActive: false }
    });

    return await prisma.workflowDefinition.create({
      data: {
        companyId,
        entityType,
        name,
        isActive: true,
        definition
      }
    });
  }

  /**
   * Retrieves the active workflow definition for a tenant, falling back to default configuration
   */
  static async getActiveDefinition(companyId: string, entityType: string): Promise<any> {
    const record = await prisma.workflowDefinition.findFirst({
      where: { companyId, entityType, isActive: true }
    });

    if (record) {
      return record.definition;
    }

    // Default static workflow fallback if no dynamic definition exists in the DB
    return this.getDefaultFallbackDefinition(entityType);
  }

  /**
   * Executes a transaction-safe dynamic state transition
   */
  static async transition(
    type: string,
    entityId: string,
    toState: string,
    context: WorkflowContext
  ) {
    const startTime = Date.now();
    LoggerService.info(`[Dynamic Workflow] Processing ${type} entity ${entityId} transition to ${toState}`);

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current status of target entity
      const current = await this.fetchEntityState(tx, type, entityId, context.companyId);
      if (!current) {
        throw new Error(`[Dynamic Workflow] Entity ${entityId} not found or tenant boundary violated.`);
      }

      const fromState = current.state;

      // 2. Fetch active workflow configuration
      const config = await this.getActiveDefinition(context.companyId, type);
      if (!config) {
        throw new Error(`[Dynamic Workflow] No active definition found for ${type}`);
      }

      // 3. Validate transition eligibility
      const allowedTransitions = config.transitions[fromState] || [];
      if (!allowedTransitions.includes(toState) && fromState !== toState) {
        throw new Error(`[Dynamic Workflow] Transition from ${fromState} to ${toState} is illegal under active schema.`);
      }

      // 4. Enforce permission rules and financial authority limits
      const rule = config.rules?.[toState];
      if (rule) {
        const requiredRoles: string[] = rule.roles || [];
        if (requiredRoles.length > 0 && !requiredRoles.includes(context.role)) {
          throw new Error(`[Dynamic Workflow] Role ${context.role} has insufficient permissions for state ${toState}. Required: ${requiredRoles.join(", ")}`);
        }

        // Financial limit checks
        const maxLimit = rule.maxAmountLimit ?? null;
        const currentAmount = context.amount ?? current.amount ?? 0;
        if (maxLimit !== null && currentAmount > maxLimit) {
          throw new Error(`[Dynamic Workflow] Financial authority limit exceeded. Action requires additional approval layer.`);
        }
      }

      // 5. Update database entity state
      const updated = await this.updateEntityState(tx, type, entityId, toState, context);

      // 6. Write to immutable audit trail
      await AuditService.log({
        userId: context.userId,
        action: "UPDATE",
        entity: type,
        entityId,
        oldData: { status: fromState },
        newData: { status: toState },
        reason: context.reason ?? `Dynamic transition to ${toState}`,
        severity: "INFO",
        correlationId: context.correlationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });

      // 7. Publish domain event
      await eventBus.publish({
        type: `${type}Transitioned`,
        payload: { entityId, fromState, toState, reason: context.reason, amount: context.amount },
        metadata: {
          userId: context.userId,
          companyId: context.companyId
        }
      });

      const elapsed = Date.now() - startTime;
      MetricsCollector.recordWorkflowTransition(elapsed);
      return updated;
    });
  }

  /**
   * Sweeps and escalates dynamic approval flows that breached SLA timers
   */
  static async processSlaEscalations(companyId: string) {
    LoggerService.info(`[Dynamic Workflow SLA] Running escalations for company ${companyId}`);
    
    // Scan all pending approval requests
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: { status: "PENDING", Project: { companyId } },
      include: { ApprovalStep: true, Project: true }
    });

    for (const req of pendingApprovals) {
      const activeStep = req.ApprovalStep.find(s => s.status === "PENDING");
      if (!activeStep) continue;

      const config = await this.getActiveDefinition(companyId, req.entityType);
      const slaLimitHours = config.slaHours?.[activeStep.stepOrder.toString()] ?? 24; // fallback to 24h
      const ageHours = (Date.now() - new Date(activeStep.createdAt).getTime()) / (1000 * 60 * 60);

      if (ageHours > slaLimitHours) {
        LoggerService.warn(`[Dynamic Workflow SLA] Request ${req.id} active step ${activeStep.id} breached SLA of ${slaLimitHours} hours (Age: ${ageHours.toFixed(1)}h). Initiating auto-escalation...`);

        // Escalation actions: route to higher role
        const escalationRole = config.escalationRoles?.[activeStep.stepOrder.toString()] || "SUPER_ADMIN";

        await prisma.$transaction(async (tx) => {
          // Record comment in approval step
          await tx.approvalStep.update({
            where: { id: activeStep.id },
            data: {
              comment: `[System SLA Escalated] Approver step breached SLA. Escalated to ${escalationRole}`,
              updatedAt: new Date()
            }
          });

          // Dispatch event bus warning
          await eventBus.publish({
            type: "KPIThresholdExceeded",
            payload: {
              requestId: req.id,
              stepId: activeStep.id,
              alert: "SLA_BREACH",
              escalatedRole: escalationRole
            },
            metadata: { companyId }
          });
        });
      }
    }
  }

  /**
   * Helper: fetches entity state and financial amounts in a multi-tenant boundary
   */
  private static async fetchEntityState(tx: any, type: string, id: string, companyId: string) {
    switch (type) {
      case "PROCUREMENT": {
        const pr = await tx.purchaseRequest.findFirst({ where: { id, deletedAt: null } });
        return pr ? { state: pr.status, amount: Number(pr.totalAmount) } : null;
      }
      case "PAYMENT": {
        const inv = await tx.invoice.findFirst({ where: { id, companyId, deletedAt: null } });
        return inv ? { state: inv.approvalStatus, amount: Number(inv.amount) } : null;
      }
      default:
        return null;
    }
  }

  /**
   * Helper: updates status on database entity
   */
  private static async updateEntityState(tx: any, type: string, id: string, toState: string, context: WorkflowContext) {
    switch (type) {
      case "PROCUREMENT":
        return await tx.purchaseRequest.update({
          where: { id },
          data: { status: toState as any }
        });
      case "PAYMENT":
        return await tx.invoice.update({
          where: { id },
          data: { approvalStatus: toState as any }
        });
      default:
        throw new Error(`[Dynamic Workflow] Unsupported entity update type: ${type}`);
    }
  }

  /**
   * Helper: Default hardcoded workflow configurations
   */
  private static getDefaultFallbackDefinition(entityType: string): any {
    if (entityType === "PROCUREMENT") {
      return {
        transitions: {
          DRAFT: ["SUBMITTED"],
          SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
          APPROVED: ["ORDERED", "CANCELLED"],
          ORDERED: ["RECEIVED", "CANCELLED"],
          RECEIVED: [],
          REJECTED: ["DRAFT"],
          CANCELLED: []
        },
        rules: {
          APPROVED: { roles: ["CFO", "SUPER_ADMIN", "ADMIN"], maxAmountLimit: 500000000 },
          ORDERED: { roles: ["MANAGER", "ADMIN"] }
        },
        slaHours: { "1": 12, "2": 24 },
        escalationRoles: { "1": "CFO", "2": "SUPER_ADMIN" }
      };
    }

    if (entityType === "PAYMENT") {
      return {
        transitions: {
          DRAFT: ["SENT"],
          SENT: ["PAID", "REJECTED", "CANCELLED"],
          PAID: [],
          REJECTED: ["DRAFT"],
          CANCELLED: []
        },
        rules: {
          PAID: { roles: ["ACCOUNTANT", "CFO", "SUPER_ADMIN"] }
        },
        slaHours: { "1": 24 },
        escalationRoles: { "1": "CFO" }
      };
    }

    return null;
  }
}
