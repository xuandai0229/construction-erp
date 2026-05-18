import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO, UpdateCostDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { round, safeDecimal } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { assertPeriodNotLocked } from "@/lib/period";
import { LoggerService } from "./logger.service";
import { CostWorkflow, CostWorkflowState } from "@/lib/workflow/costWorkflow";
import { DuplicateRequestError } from "@/lib/errors";
import { eventBus } from "@/lib/event-bus";

export interface ServiceOptions {
  userId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class CostService {
  /**
   * CREATE with Idempotency & Workflow initialization
   */
  static async create(data: CreateCostDTO, options: ServiceOptions = {}) {
    assertValidEntity(data, "CreateCostDTO");
    if (data.amount <= 0) throw new ApiError(400, "Số tiền chi phí phải lớn hơn 0");
    await assertPeriodNotLocked(data.date || new Date());

    const { userId, correlationId } = options;
    const requestId = data.requestId;

    // 1. Pre-flight Idempotency Check
    if (requestId) {
      const existing = await prisma.costRecord.findUnique({ where: { requestId } });
      if (existing) {
        LoggerService.info(`Idempotency hit (pre-check) for requestId ${requestId}`, { correlationId });
        return existing;
      }
    }

    // 2. Validate Relationships
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) {
      throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");
    }

    const amountD = safeDecimal(data.amount);
    const vatRateD = safeDecimal(data.vatRate || 0);
    const retentionRateD = safeDecimal(data.retentionRate || 0);

    // If netAmount is provided, use it as the base. Otherwise, back-calculate from total amount.
    let netAmountD = data.netAmount ? safeDecimal(data.netAmount) : amountD.div(vatRateD.div(100).add(1));
    let vatAmountD = data.vatAmount ? safeDecimal(data.vatAmount) : amountD.sub(netAmountD);
    
    // Final Reconciliation: amount = net + vat (to prevent rounding drift)
    const finalAmountD = netAmountD.add(vatAmountD);
    const retentionAmountD = finalAmountD.mul(retentionRateD.div(100));

    try {
      const item = await prisma.$transaction(async (tx) => {
        // Double-check idempotency inside transaction for absolute safety
        if (requestId) {
          const locked = await tx.costRecord.findUnique({ 
            where: { requestId },
            select: { id: true } 
          });
          if (locked) throw new DuplicateRequestError();
        }

        // Cost Control: Check against BOQ
        const boqAgg = await tx.bOQItem.aggregate({
          where: { wbsId: data.wbsId, deletedAt: null },
          _sum: { totalAmount: true }
        });

        const existingCosts = await tx.costRecord.aggregate({
          where: { wbsId: data.wbsId, deletedAt: null },
          _sum: { amount: true }
        });

        const totalBOQ = Number(boqAgg._sum?.totalAmount || 0);
        const currentCosts = Number(existingCosts._sum?.amount || 0);
        const totalCostsAfter = round(currentCosts + finalAmountD.toNumber());

        if (totalBOQ > 0 && totalCostsAfter > totalBOQ) {
          LoggerService.warn(`Cost Overrun detected for WBS ${data.wbsId}`, {
            totalBOQ,
            currentCosts,
            requestedAmount: finalAmountD.toNumber(),
            totalCostsAfter,
            correlationId
          });
        }

        // Create Cost Record in DRAFT
        const item = await tx.costRecord.create({
          data: {
            requestId,
            projectId: data.projectId,
            wbsId: data.wbsId,
            costType: data.costType,
            amount: finalAmountD.toNumber(),
            netAmount: netAmountD.toNumber(),
            vatAmount: vatAmountD.toNumber(),
            vatRate: vatRateD.toNumber(),
            retentionAmount: retentionAmountD.toNumber(),
            retentionRate: retentionRateD.toNumber(),
            quantity: data.quantity ?? 1,
            unitPrice: data.unitPrice ?? 0,
            supplier: data.supplier,
            note: data.note,
            date: data.date ? new Date(data.date) : new Date(),
            status: data.status,
            createdById: userId || data.createdById,
            approvalStatus: "DRAFT",
            workflowStatus: "DRAFT",
            version: 1
          }
        });

        await AuditService.log({
          userId: userId || data.createdById,
          action: "CREATE",
          entity: "CostRecord",
          entityId: item.id,
          newData: item,
          requestId,
          correlationId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent
        });

        return item;
      });

      // Run heavy aggregation and outbox event publishing OUTSIDE transaction to prevent deadlock & escalation locks
      const { ProjectService } = require("./project.service");
      ProjectService.getAccountingSummary(item.projectId).catch((e: any) => {
        LoggerService.error("Failed to sync project stats after cost create", { error: e });
      });

      eventBus.publish({
        type: 'COST_CREATED',
        payload: item,
        metadata: { userId, projectId: data.projectId }
      }).catch((e) => {
        LoggerService.error("Failed to publish COST_CREATED event", { error: e });
      });

      return item;
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('requestId')) {
        const existing = await prisma.costRecord.findUnique({ where: { requestId } });
        if (existing) return existing;
        throw new DuplicateRequestError();
      }
      throw error;
    }
  }

  /**
   * UPDATE with Workflow protection
   */
  static async update(id: string, data: UpdateCostDTO, options: ServiceOptions = {}) {
    const { userId, correlationId } = options;
    
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    // Block update if not in editable state
    if (existing.workflowStatus !== "DRAFT" && existing.workflowStatus !== "REJECTED") {
      throw new ApiError(400, `Không thể sửa chi phí khi đang ở trạng thái ${existing.workflowStatus}`);
    }

    await assertPeriodNotLocked(existing.date);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.costRecord.update({
        where: { id, version: existing.version }, // Optimistic locking
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          version: { increment: 1 }
        }
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        newData: updated,
        correlationId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      return updated;
    });
  }

  /**
   * SOFT DELETE & REVERSE JOURNAL
   */
  static async delete(id: string, options: ServiceOptions = {}) {
    const { userId, correlationId } = options;
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    await assertPeriodNotLocked(existing.date);

    if (existing.workflowStatus === "POSTED" || existing.workflowStatus === "APPROVED" || existing.approvalStatus === "APPROVED") {
      throw new ApiError(400, "LỖI NGHIỆP VỤ: Không thể xóa chi phí đã được duyệt hoặc ghi sổ kế toán.", {
        isFinancialLocked: true,
        actionSuggested: "REVERSE"
      });
    }

    await prisma.$transaction(async (tx) => {
      // A. SOFT DELETE for DRAFT/REJECTED items (Aligning with lib/prisma.ts security policy)
      const item = await tx.costRecord.update({ 
        where: { id },
        data: { deletedAt: new Date(), version: { increment: 1 } }
      });

      await AuditService.log({
        userId,
        action: "HARD_DELETE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        reason: "Xóa vĩnh viễn chi phí nháp (Hard Delete).",
        correlationId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      return item;
    });

    // Run heavy aggregation OUTSIDE transaction to prevent deadlock & escalation locks
    const { ProjectService } = require("./project.service");
    ProjectService.getAccountingSummary(existing.projectId).catch((e: any) => {
      LoggerService.error("Failed to sync project stats after cost delete", { error: e });
    });

    return { ...existing, deletedAt: new Date() };
  }

  /**
   * TRANSITION WORKFLOW (APPROVE/REJECT/POST)
   */
  static async transition(id: string, nextStatus: CostWorkflowState, options: ServiceOptions = {}) {
    const { userId, correlationId } = options;
    
    const existing = await prisma.costRecord.findUnique({ 
      where: { id },
      include: { wbs: true } 
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    // 1. Enforce Segregation of Duties & RBAC Permissions (Batch 6.1 & 6.5)
    if (userId && userId !== "system_internal_admin") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { RBAC } = require("@/lib/rbac");
        
        // Segregation of Duties (SoD): Creator cannot approve or post their own transactions
        if (nextStatus === "APPROVED" || nextStatus === "POSTED") {
          RBAC.assertSegregationOfDuties(existing.createdById, user.id);
        }

        // Action-level permission check
        let action: any = "UPDATE";
        if (nextStatus === "APPROVED") action = "APPROVE";
        else if (nextStatus === "POSTED") action = "POST";
        else if (nextStatus === "REVERSED") action = "REVERSE";
        
        RBAC.assertPermission(user.role, "COST", action);

        // Financial authority limit check
        const limit = RBAC.getFinancialLimit(user.role);
        const costAmount = Number(existing.amount);
        if (costAmount > limit) {
          throw new ApiError(
            403,
            `Lỗi hạn mức: Số tiền chứng từ (${costAmount.toLocaleString("vi-VN")} ₫) vượt hạn mức phê duyệt tối đa của vai trò ${user.role} (${limit.toLocaleString("vi-VN")} ₫).`
          );
        }
      }
    }

    // 1.5. Validate Transition
    CostWorkflow.validateTransition(existing.workflowStatus, nextStatus);

    const item = await prisma.$transaction(async (tx) => {
      // 2. Update Status
      const item = await tx.costRecord.update({
        where: { id, version: existing.version },
        data: { 
          workflowStatus: nextStatus,
          approvalStatus: (nextStatus === "APPROVED" || nextStatus === "POSTED") ? "APPROVED" : 
                          nextStatus === "REJECTED" ? "REJECTED" : "PENDING",
          version: { increment: 1 }
        }
      });

      // 3. Trigger Side Effects (e.g., Posting to Ledger)
      if (nextStatus === "POSTED") {
        await PostingEngine.postCost(tx, {
          costId: item.id,
          projectId: item.projectId,
          amount: Number(item.amount),
          costType: item.costType,
          description: item.note || `Chi phí ${item.costType} cho ${existing.wbs?.name || id}`
        });
      } else if (nextStatus === "REVERSED" && (existing.workflowStatus === "POSTED" || existing.approvalStatus === "APPROVED")) {
        await PostingEngine.reverseJournal(tx, id, "COST", userId || "SYSTEM");
      }

      await AuditService.log({
        userId,
        action: nextStatus === "APPROVED" ? "APPROVE" : nextStatus === "REJECTED" ? "REJECT" : "UPDATE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        newData: item,
        correlationId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      return item;
    });

    eventBus.publish({
      type: nextStatus === "APPROVED" ? 'COST_APPROVED' : 
            nextStatus === "POSTED" ? 'COST_POSTED' : 
            nextStatus === "REJECTED" ? 'COST_REJECTED' : 'COST_UPDATED',
      payload: item,
      metadata: { userId, projectId: item.projectId }
    }).catch((e) => {
      LoggerService.error("Failed to publish cost state transition event", { error: e });
    });

    return item;
  }

  static async findByProject(projectId: string, filters: any = {}) {
    const { costType, status, startDate, endDate, limit, skip } = filters;
    
    return prisma.costRecord.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(costType && { costType }),
        ...(status && { status }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      take: limit ? Number(limit) : 500,
      skip: skip ? Number(skip) : 0,
      orderBy: { date: "desc" },
      include: {
        wbs: { select: { name: true } }
      }
    });
  }
}

