import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { AuditService } from "../audit.service";
import { eventBus } from "@/lib/event-bus";

interface WorkflowInitRequest {
  entityType: string;
  entityId: string;
  projectId: string;
  requesterId: string;
  amount: number;
  dataSnapshot: any;
}

export class ApprovalOrchestrator {
  /**
   * Initializes a multi-step approval workflow.
   * Auto-resolves the approval chain based on Authority Matrix.
   */
  static async initializeWorkflow(req: WorkflowInitRequest) {
    // 1. Determine Required Approvers based on amount and entityType
    const matrix = await prisma.authorityMatrix.findMany({
      where: { entityType: req.entityType },
      orderBy: { maxAmount: 'asc' }
    });

    if (matrix.length === 0) {
      LoggerService.warn(`No authority matrix found for ${req.entityType}`);
    }

    // A real algorithm would map roles to specific users in the project
    // Here we'll simulate building an approval chain
    const approvers = await this.resolveApproversForProject(req.projectId, req.amount);

    if (approvers.length === 0) {
      throw new Error(`Cannot resolve approvers for project ${req.projectId}`);
    }

    // 2. Create the Approval Request
    const request = await prisma.approvalRequest.create({
      data: {
        id: crypto.randomUUID(),
        projectId: req.projectId,
        requesterId: req.requesterId,
        entityType: req.entityType,
        entityId: req.entityId,
        requestData: req.dataSnapshot,
        status: "PENDING",
        updatedAt: new Date(),
        ApprovalStep: {
          create: approvers.map((approver, index) => ({
            id: crypto.randomUUID(),
            approverId: approver.id,
            stepOrder: index + 1,
            status: "PENDING",
            updatedAt: new Date()
          }))
        }
      },
      include: { ApprovalStep: true }
    });

    LoggerService.info(`[Workflow] Initialized Approval Chain for ${req.entityType} ${req.entityId}`, { requestId: request.id });

    // 3. Notify first approver
    const firstStep = request.ApprovalStep.find(s => s.stepOrder === 1);
    if (firstStep) {
      await this.notifyApprover(firstStep);
    }

    return request;
  }

  static async processStep(stepId: string, actorId: string, action: "APPROVED" | "REJECTED", comment?: string) {
    const step = await prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: { ApprovalRequest: { include: { ApprovalStep: true } } }
    });

    if (!step) throw new Error("Approval Step not found");
    if (step.status !== "PENDING") throw new Error("Step already processed");

    // Enterprise Delegation Check
    const activeDelegate = await prisma.delegationWindow.findFirst({
      where: {
        ownerId: step.approverId,
        delegateId: actorId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    if (step.approverId !== actorId && !activeDelegate) {
      throw new Error("Unauthorized to process this approval step");
    }

    // Process Step
    await prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: action,
        comment,
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: action === "APPROVED" ? "APPROVE" : "REJECT",
      entity: "ApprovalStep",
      entityId: stepId,
      userId: actorId,
      reason: comment,
      severity: "INFO"
    });

    const request = step.ApprovalRequest;

    if (action === "REJECTED") {
      // Reject entire chain
      await prisma.approvalRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED", updatedAt: new Date() }
      });
      eventBus.publish({ 
        type: "WORKFLOW_REJECTED", 
        payload: { requestId: request.id },
        metadata: { userId: actorId, projectId: request.projectId || undefined }
      });
    } else {
      // Check if this was the last step
      const nextStep = request.ApprovalStep.find(s => s.stepOrder === step.stepOrder + 1);
      if (nextStep) {
        await this.notifyApprover(nextStep);
      } else {
        // Workflow completed successfully
        await prisma.approvalRequest.update({
          where: { id: request.id },
          data: { status: "APPROVED", updatedAt: new Date() }
        });
        eventBus.publish({ 
          type: "WORKFLOW_APPROVED", 
          payload: { requestId: request.id },
          metadata: { userId: actorId, projectId: request.projectId || undefined }
        });
      }
    }
  }

  private static async resolveApproversForProject(projectId: string, amount: number) {
    // Mocking approver resolution based on role in project
    const pms = await prisma.user.findMany({ where: { role: 'MANAGER' }, take: 1 });
    const directors = await prisma.user.findMany({ where: { role: 'GROUP_DIRECTOR' }, take: 1 });
    
    let chain = pms;
    if (amount > 500000000) { // If > 500M VND, require Director
      chain = [...pms, ...directors];
    }
    return chain;
  }

  private static async notifyApprover(step: any) {
    eventBus.publish({ 
      type: "APPROVAL_REQUIRED", 
      payload: { stepId: step.id, approverId: step.approverId },
      metadata: { userId: step.approverId }
    });
    LoggerService.info(`[Workflow] Notified Approver ${step.approverId} for Step ${step.id}`);
  }
}
