import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { RBAC, AppAction } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { ApprovalService } from "./approval.service";
import { OperationalService } from "./operational.service";

export class CostService {
  static async create(data: CreateCostDTO) {
    assertValidEntity(data, "CreateCostDTO");

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
      // Cost Control Logic: Warning if cost > budget
      const budget = await tx.budgetRecord.aggregate({
        where: { wbsId: data.wbsId },
        _sum: { estimatedAmount: true }
      });

      const existingCosts = await tx.costRecord.aggregate({
        where: { wbsId: data.wbsId },
        _sum: { amount: true }
      });

      const totalBudget = budget._sum?.estimatedAmount ? Number(budget._sum.estimatedAmount) : 0;
      const currentCosts = existingCosts._sum?.amount ? Number(existingCosts._sum.amount) : 0;
      const totalCostsAfter = round(currentCosts + roundedAmount);

      if (totalBudget > 0 && totalCostsAfter > totalBudget) {
        console.warn(`WARNING: Cost overrun for WBS ${data.wbsId}. Budget: ${totalBudget}, Actual: ${totalCostsAfter}`);
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
          createdById: data.createdById
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
    const { costType, status, startDate, endDate, page = 1, limit = 50 } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const where = {
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
    };

    const [items, total] = await Promise.all([
      prisma.costRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take,
        include: {
          wbs: { select: { name: true } }
        }
      }),
      prisma.costRecord.count({ where })
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  static async update(id: string, data: {
    wbsId?: string;
    costType?: any;
    amount?: number;
    quantity?: number;
    unitPrice?: number;
    supplier?: string;
    note?: string;
    date?: string;
    userId?: string;
    userRole?: UserRole; // Added for RBAC
  }) {
    const existing = await prisma.costRecord.findUnique({ 
      where: { id, deletedAt: null } 
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí hoặc bản ghi đã bị xóa");

    // ─── PERIOD LOCK GUARD ──────────────────────────────
    const isLocked = await OperationalService.isPeriodLocked(existing.date);
    if (isLocked) {
      throw new ApiError(403, "Kỳ kế toán này đã được chốt sổ. Không thể sửa đổi dữ liệu quá khứ.");
    }

    // ─── AUTHORIZATION ──────────────────────────────────
    if (data.userId && data.userRole) {
      await RBAC.authorize({
        userId: data.userId,
        userRole: data.userRole,
        action: AppAction.FINANCIAL_UPDATE,
        projectId: existing.projectId
      });

      // Special check for amount/type changes (Reversal)
      const isSensitiveChange = data.amount !== undefined || data.costType !== undefined;
      if (isSensitiveChange) {
        await RBAC.authorize({
          userId: data.userId,
          userRole: data.userRole,
          action: AppAction.FINANCIAL_REVERSE,
          projectId: existing.projectId
        });
      }
    }

    const amountChanged = data.amount !== undefined && round(data.amount) !== Number(existing.amount);
    const newAmount = amountChanged ? round(data.amount!) : Number(existing.amount);

    // ─── APPROVAL WORKFLOW ──────────────────────────────
    if (amountChanged && data.userRole !== UserRole.ADMIN) {
      const isApproved = await ApprovalService.isActionApproved("COST_REVERSE", id);
      if (!isApproved) {
        throw new ApiError(403, "Thay đổi số tiền chi phí cần được phê duyệt trước khi thực hiện. Vui lòng gửi yêu cầu phê duyệt.");
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. If amount or costType changes, we must reverse the old ledger entry
      if (amountChanged || (data.costType !== undefined && data.costType !== existing.costType)) {
        await PostingEngine.reverseEntries(tx, {
          sourceId: id,
          sourceType: "COST",
          reason: "Điều chỉnh chi phí (Amount/Type update)"
        });
      }

      // 2. Update Record
      const item = await tx.costRecord.update({
        where: { id },
        data: {
          ...(data.wbsId !== undefined && { wbsId: data.wbsId }),
          ...(data.costType !== undefined && { costType: data.costType }),
          ...(data.amount !== undefined && { amount: newAmount }),
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
          ...(data.supplier !== undefined && { supplier: data.supplier }),
          ...(data.note !== undefined && { note: data.note }),
          ...(data.date !== undefined && { date: data.date ? new Date(data.date) : undefined }),
        },
      });

      // 3. Post new ledger entry if reversed or amount changed
      if (amountChanged || (data.costType !== undefined && data.costType !== existing.costType)) {
        await PostingEngine.postCost(tx, {
          costId: item.id,
          projectId: item.projectId,
          amount: newAmount,
          costType: item.costType,
          description: item.note || `Điều chỉnh chi phí ${item.costType}`
        });
      }

      // 4. Audit Logging
      await AuditService.log({
        tx,
        userId: data.userId,
        action: amountChanged ? "REVERSE" : "UPDATE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing,
        newData: item,
        severity: amountChanged ? "WARNING" : "INFO",
        reason: amountChanged ? "Cập nhật số tiền chi phí (Yêu cầu đảo bút toán)" : "Cập nhật thông tin chi phí",
      });

      return item;
    });
  }

  static async delete(id: string, userId?: string, userRole?: UserRole) {
    const existing = await prisma.costRecord.findUnique({ 
      where: { id, deletedAt: null } 
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí hoặc đã bị xóa");

    // ─── AUTHORIZATION ──────────────────────────────────
    if (userId && userRole) {
      await RBAC.authorize({
        userId,
        userRole,
        action: AppAction.FINANCIAL_DELETE,
        projectId: existing.projectId
      });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Reverse Ledger Entries
      await PostingEngine.reverseEntries(tx, {
        sourceId: id,
        sourceType: "COST",
        reason: "Xóa chi phí (Soft Delete)"
      });

      // 2. Audit Logging
      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing
      });

      // 3. Soft Delete
      return tx.costRecord.update({ 
        where: { id },
        data: { deletedAt: new Date() }
      });
    });
  }
}
