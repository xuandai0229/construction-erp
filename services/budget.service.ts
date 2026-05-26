import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateBudgetDTO, UpdateBudgetDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { AuditService } from "./audit.service";
import { CacheService } from "./cache.service";
import { assertPeriodNotLocked } from "@/lib/period";

export class BudgetService {
  /**
   * Helper to sync Project.totalBudget directly
   * Single Source of Truth Alignment (Persisted Derived)
   */
  private static async syncProjectBudget(projectId: string) {
    const agg = await prisma.budgetRecord.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { estimatedAmount: true }
    });
    const total = Number(agg._sum.estimatedAmount || 0);
    await prisma.project.update({
      where: { id: projectId },
      data: { totalBudget: total }
    });
  }

  private static async invalidateCaches(projectId: string) {
    await CacheService.invalidateFinancialProject(projectId);
  }

  static async create(data: CreateBudgetDTO) {
    assertValidEntity(data, "CreateBudgetDTO");
    await assertPeriodNotLocked(new Date());

    if ((data as any).requestId) {
      const lockKey = `idempotency:budget:${(data as any).requestId}`;
      const isLocked = await CacheService.get(lockKey);
      if (isLocked) {
        const { DuplicateRequestError } = await import("@/lib/errors");
        throw new DuplicateRequestError();
      }
      await CacheService.set(lockKey, true, 60000); // 1 minute lock
    }

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");

    const amount = Math.round((data.estimatedAmount + Number.EPSILON) * 100) / 100;

    const budget = await prisma.budgetRecord.create({
      data: {
        projectId: data.projectId,
        wbsId: data.wbsId,
        costType: data.costType,
        estimatedAmount: amount,
        createdById: data.createdById, // Extracted from session in API
      },
    });

    await AuditService.log({
      userId: data.createdById || "SYSTEM",
      action: "CREATE",
      entity: "BudgetRecord",
      entityId: budget.id,
      newData: budget,
    });

    await this.syncProjectBudget(data.projectId);
    await this.invalidateCaches(data.projectId);

    return budget;
  }

  static async update(id: string, data: UpdateBudgetDTO, userId?: string) {
    assertValidEntity(data, "UpdateBudgetDTO");
    const existing = await prisma.budgetRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy dự toán");

    await assertPeriodNotLocked(existing.createdAt);
    const amount = data.estimatedAmount !== undefined ? Math.round((data.estimatedAmount + Number.EPSILON) * 100) / 100 : undefined;

    const budget = await prisma.budgetRecord.update({
      where: { id },
      data: {
        ...(data.wbsId !== undefined && { wbsId: data.wbsId }),
        ...(data.costType !== undefined && { costType: data.costType }),
        ...(amount !== undefined && { estimatedAmount: amount }),
      }
    });

    await AuditService.log({
      userId: userId || "SYSTEM",
      action: "UPDATE",
      entity: "BudgetRecord",
      entityId: budget.id,
      oldData: existing,
      newData: budget,
    });

    await this.syncProjectBudget(budget.projectId);
    await this.invalidateCaches(budget.projectId);

    return budget;
  }

  static async findByProject(projectId: string) {
    return prisma.budgetRecord.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { wbs: { select: { name: true } } }
    });
  }

  static async delete(id: string, userId?: string) {
    const existing = await prisma.budgetRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy dự toán");
    
    await assertPeriodNotLocked(existing.createdAt);
    const deleted = await prisma.budgetRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    await AuditService.log({
      userId: userId || "SYSTEM",
      action: "DELETE",
      entity: "BudgetRecord",
      entityId: id,
      oldData: existing,
      newData: deleted,
      reason: "Soft delete budget allocation; project budget totals recalculated."
    });

    await this.syncProjectBudget(existing.projectId);
    await this.invalidateCaches(existing.projectId);
    
    return deleted;
  }
}
