import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { assertPeriodNotLocked } from "@/lib/period";
import { LoggerService } from "./logger.service";

export class CostService {
  static async create(data: CreateCostDTO) {
    assertValidEntity(data, "CreateCostDTO");
    await assertPeriodNotLocked(data.date || new Date());

    // 1. Validate Project existence
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    // 2. Validate WBS existence and ownership
    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) {
      throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");
    }

    const roundedAmount = round(data.amount);

    return prisma.$transaction(async (tx) => {
      // 2. Cost Control Logic: Compare against BOQ
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
        // We log a warning but allow the transaction in this "MVP" state 
        // In real enterprise we might block it if policy is "HARD_BLOCK"
        LoggerService.warn(`Cost Overrun detected for WBS ${data.wbsId}`, {
          totalBOQ,
          currentCosts,
          requestedAmount: roundedAmount,
          totalCostsAfter
        });
      }

      // 3. Create Cost Record
      const item = await tx.costRecord.create({
        data: {
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
          createdById: data.createdById,
          approvalStatus: "DRAFT" // New costs start as DRAFT
        }
      });

      // 4. Posting to Ledger (Double Entry)
      await PostingEngine.postCost(tx, {
        costId: item.id,
        projectId: item.projectId,
        amount: roundedAmount,
        costType: item.costType,
        description: item.note || `Chi phí ${item.costType} cho ${wbs.name}`
      });

      // 5. Audit Logging
      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "CostRecord",
        entityId: item.id,
        newData: item
      });

      return item;
    });
  }

  static async findByProject(projectId: string, filters: any = {}) {
    const { costType, status, startDate, endDate, limit, skip } = filters;
    
    return prisma.costRecord.findMany({
      where: {
        projectId,
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

  static async delete(id: string, userId?: string) {
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    await assertPeriodNotLocked(existing.date);

    return prisma.$transaction(async (tx) => {
      const item = await tx.costRecord.update({ 
        where: { id },
        data: { 
          deletedAt: new Date(),
          deletedById: userId,
        }
      });

      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        reason: "User requested soft delete",
      });

      return item;
    });
  }

  static async updateApproval(id: string, status: "APPROVED" | "REJECTED" | "PENDING", userId?: string) {
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    const item = await prisma.costRecord.update({
      where: { id },
      data: { approvalStatus: status }
    });

    await AuditService.log({
      userId,
      action: status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "UPDATE",
      entity: "CostRecord",
      entityId: id,
      oldData: existing,
      newData: item,
    });

    return item;
  }
}
