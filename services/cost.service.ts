import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO, UpdateCostDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { assertPeriodNotLocked } from "@/lib/period";
import { LoggerService } from "./logger.service";
import { CostWorkflow, CostWorkflowState } from "@/lib/workflow/costWorkflow";
import { DuplicateRequestError } from "@/lib/errors";

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

    const roundedAmount = round(data.amount);

    try {
      return await prisma.$transaction(async (tx) => {
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
        const totalCostsAfter = round(currentCosts + roundedAmount);

        if (totalBOQ > 0 && totalCostsAfter > totalBOQ) {
          LoggerService.warn(`Cost Overrun detected for WBS ${data.wbsId}`, {
            totalBOQ,
            currentCosts,
            requestedAmount: roundedAmount,
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
            amount: roundedAmount,
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

    return prisma.$transaction(async (tx) => {
      // 1. Soft Delete
      const item = await tx.costRecord.update({ 
        where: { id, version: existing.version },
        data: { 
          deletedAt: new Date(),
          deletedById: userId,
          workflowStatus: "REVERSED",
          version: { increment: 1 }
        }
      });

      // 2. Reverse Journal if it was POSTED
      if (existing.workflowStatus === "POSTED" || existing.approvalStatus === "APPROVED") {
        await PostingEngine.reverseJournal(tx, id, "COST", userId || "SYSTEM");
      }

      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        reason: "User requested soft delete with reverse journal",
        correlationId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      return item;
    });
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

    // 1. Validate Transition
    CostWorkflow.validateTransition(existing.workflowStatus, nextStatus);

    return prisma.$transaction(async (tx) => {
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
      }

      // 4. Audit
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

