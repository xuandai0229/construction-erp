import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateBudgetDTO, UpdateBudgetDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { AuditService } from "./audit.service";
import { CacheService } from "./cache.service";

export class BudgetService {
  /**
   * Helper to sync Project.totalBudget directly
   * Single Source of Truth Alignment (Persisted Derived)
   */
  private static async syncProjectBudget(projectId: string) {
    const agg = await prisma.budgetRecord.aggregate({
      where: { projectId },
      _sum: { estimatedAmount: true }
    });
    const total = Number(agg._sum.estimatedAmount || 0);
    await prisma.project.update({
      where: { id: projectId },
      data: { totalBudget: total }
    });
  }

  private static async invalidateCaches(projectId: string) {
    await CacheService.invalidatePrefix(`wbs:${projectId}`);
    await CacheService.invalidatePrefix(`aggregation:${projectId}`);
    await CacheService.invalidatePrefix(`reporting:${projectId}`);
  }

  static async create(data: CreateBudgetDTO) {
    assertValidEntity(data, "CreateBudgetDTO");

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
      where: { projectId }, // Hard delete model, no deletedAt check needed
      orderBy: { createdAt: "asc" },
      include: { wbs: { select: { name: true } } }
    });
  }

  static async delete(id: string, userId?: string) {
    const existing = await prisma.budgetRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy dự toán");
    
    // HARD DELETE POLICY ALIGNMENT
    const deleted = await prisma.budgetRecord.delete({ where: { id } });
    
    await AuditService.log({
      userId: userId || "SYSTEM",
      action: "HARD_DELETE",
      entity: "BudgetRecord",
      entityId: id,
      oldData: existing,
      reason: "Permanent Delete per WBS Architecture Rules"
    });

    await this.syncProjectBudget(existing.projectId);
    await this.invalidateCaches(existing.projectId);
    
    return deleted;
  }
}
