import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ApprovalStatus, UserRole } from "@prisma/client";
import { AuditService } from "./audit.service";

export class ApprovalService {
  /**
   * Creates a new approval request for a sensitive action.
   */
  static async createRequest(params: {
    projectId: string;
    requesterId: string;
    entityType: string;
    entityId?: string;
    requestData: any;
    reason?: string;
    requiredApproverRoles?: UserRole[];
  }) {
    const { projectId, requesterId, entityType, entityId, requestData, reason, requiredApproverRoles } = params;

    return prisma.$transaction(async (tx) => {
      // 1. Create Request
      const request = await tx.approvalRequest.create({
        data: {
          projectId,
          requesterId,
          entityType,
          entityId,
          requestData,
          reason,
          status: "PENDING",
        },
      });

      // 2. Create Steps (based on roles or fixed logic)
      // For now, we'll assign to any ADMIN or specified roles
      const roles = requiredApproverRoles || [UserRole.ADMIN];
      const potentialApprovers = await tx.user.findMany({
        where: { role: { in: roles }, deletedAt: null },
      });

      if (potentialApprovers.length === 0) {
        throw new ApiError(400, "Không tìm thấy người phê duyệt phù hợp cho yêu cầu này.");
      }

      // Create one step for each potential approver (OR model - any one can approve)
      // Actually, standard logic is one step per role or individual.
      // We'll create one step per role group for simplicity.
      await tx.approvalStep.createMany({
        data: potentialApprovers.map((u, index) => ({
          approvalRequestId: request.id,
          approverId: u.id,
          status: "PENDING",
          stepOrder: 1, // Parallel approval for step 1
        })),
      });

      await AuditService.log({
        tx,
        userId: requesterId,
        action: "CREATE",
        entity: "ApprovalRequest",
        entityId: request.id,
        newData: request,
        reason: `Yêu cầu phê duyệt cho ${entityType}`,
      });

      return request;
    });
  }

  /**
   * P3: Realtime Approval Acceleration
   * Checks for overdue approvals and escalates or sends reminders.
   */
  static async checkApprovalHealth() {
    const overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date();

    const pendingSteps = await prisma.approvalStep.findMany({
      where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - overdueThreshold) } },
      include: { approver: true, request: true }
    });

    const results = [];
    for (const step of pendingSteps) {
      // 1. Log Escalation/Reminder Event
      await AuditService.log({
        userId: step.approverId,
        action: "REMINDER",
        entity: "ApprovalStep",
        entityId: step.id,
        reason: "QUÁ HẠN PHÊ DUYỆT (>24h). Yêu cầu xử lý gấp.",
        severity: "WARNING"
      });

      // 2. Business Logic: Auto-escalate if it's the second reminder
      // For pilot, we just flag it.
      results.push({
        requestId: step.approvalRequestId,
        approver: step.approver.name,
        delay: (now.getTime() - step.createdAt.getTime()) / (1000 * 60 * 60) // hours
      });
    }
    return results;
  }

  /**
   * Approves or Rejects a step.
   */
  static async processStep(params: {
    requestId: string;
    approverId: string;
    status: "APPROVED" | "REJECTED";
    comment?: string;
  }) {
    const { requestId, approverId, status, comment } = params;

    return prisma.$transaction(async (tx) => {
      const step = await tx.approvalStep.findFirst({
        where: { approvalRequestId: requestId, approverId, status: "PENDING" },
      });

      if (!step) throw new ApiError(404, "Không tìm thấy bước phê duyệt hợp lệ cho bạn.");

      // 1. Update Step
      await tx.approvalStep.update({
        where: { id: step.id },
        data: {
          status: status === "APPROVED" ? "APPROVED" : "REJECTED",
          comment,
          processedAt: new Date(),
        },
      });

      // 2. Check if request is fully approved or rejected
      if (status === "REJECTED") {
        await tx.approvalRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        });
      } else {
        // If ANY one in the current stepOrder approves, the request is approved.
        await tx.approvalRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        });
      }

      await AuditService.log({
        tx,
        userId: approverId,
        action: "UPDATE",
        entity: "ApprovalRequest",
        entityId: requestId,
        newData: { status, comment },
        reason: `Xử lý phê duyệt: ${status}`,
      });
    });
  }

  /**
   * Checks if an entity action is approved.
   */
  static async isActionApproved(entityType: string, entityId: string): Promise<boolean> {
    const request = await prisma.approvalRequest.findFirst({
      where: { entityType, entityId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
    return !!request;
  }
}
