import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "./audit.service";
import { LoggerService } from "./logger.service";
import { ApprovalStatus } from "@prisma/client";

export class ApprovalService {
  /**
   * Tạo một yêu cầu phê duyệt mới.
   */
  static async createRequest(data: {
    projectId: string;
    requesterId: string;
    entityType: string;
    entityId: string;
    requestData?: any;
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 0. Idempotency Check / Anti Double-Submit
      const existingPending = await tx.approvalRequest.findFirst({
        where: {
          entityType: data.entityType,
          entityId: data.entityId,
          status: "PENDING"
        }
      });
      if (existingPending) {
        return existingPending;
      }

      // 1. Tạo request
      const id = crypto.randomUUID();
      const request = await tx.approvalRequest.create({
        data: {
          id,
          projectId: data.projectId,
          requesterId: data.requesterId,
          entityType: data.entityType,
          entityId: data.entityId,
          requestData: data.requestData ? JSON.parse(JSON.stringify(data.requestData)) : null,
          reason: data.reason,
          status: "PENDING",
          updatedAt: new Date()
        }
      });

      // 2. Audit Log
      await AuditService.log({
        userId: data.requesterId,
        action: "CREATE",
        entity: "ApprovalRequest",
        entityId: request.id,
        newData: request,
        reason: data.reason
      });

      return request;
    });
  }

  /**
   * Xử lý phê duyệt/từ chối một bước (hoặc toàn bộ request).
   */
  static async processStep(
    requestId: string,
    approverId: string,
    status: ApprovalStatus,
    comment?: string
  ) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
       throw new ApiError(400, "Trạng thái phê duyệt không hợp lệ.");
    }

    return prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findUnique({
        where: { id: requestId },
        include: { ApprovalStep: true }
      });

      if (!request) throw new ApiError(404, "Không tìm thấy yêu cầu phê duyệt");
      if (request.status !== "PENDING") {
        throw new ApiError(400, `Yêu cầu này đã được xử lý (${request.status}).`);
      }

      // Đơn giản hóa: Trong phiên bản này, phê duyệt 1 bước cập nhật luôn request.
      // (Thực tế Enterprise sẽ có state machine phức tạp hơn)
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: status,
          updatedAt: new Date()
        }
      });

      // Audit Log
      await AuditService.log({
        userId: approverId,
        action: status === "APPROVED" ? "APPROVE" : "REJECT",
        entity: "ApprovalRequest",
        entityId: request.id,
        oldData: request,
        newData: updatedRequest,
        reason: comment
      });

      await LoggerService.info(`Approval request ${requestId} ${status} by user ${approverId}`);

      return updatedRequest;
    });
  }
}
