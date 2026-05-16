import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "./financial-aggregation.service";
import { ApiError } from "@/lib/api-error";
import { CreateWBSDTO, UpdateWBSDTO } from "@/lib/validations";
import { AuditService } from "./audit.service";
import { ProjectFinance } from "./finance/projectFinance";
import { CostRecord, BudgetRecord, WBSItem } from "@/app/types";

export class WBSService {
  static async findByProject(projectId: string) {
    const result = await FinancialAggregationService.getWBSAggregation(projectId);
    const { tree, stats } = result;

    // Maintain flat list for exports/legacy use
    const items = await prisma.wBSItem.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    return {
      tree,
      flat: items, // Simplified flat list
      stats: {
        totalItems: items.length,
        totalBudget: stats.totalApproved > 0 ? stats.totalApproved : 0, // Adjusted context
        totalActual: stats.totalApproved,
        variance: 0, 
        progress: stats.healthScore,
        isCostOverrun: stats.orphanTotal > 0,
        ...stats
      },
    };
  }

  static async create(data: CreateWBSDTO, userId?: string) {
    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
      if (parent.projectId !== data.projectId) throw new ApiError(400, "Hạng mục cha phải thuộc cùng một dự án");
    }

    let level = 0;
    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      level = (parent?.level ?? 0) + 1;
    }

    const item = await prisma.wBSItem.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        code: data.code ?? null,
        parentId: data.parentId ?? null,
        level,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "WBSItem",
      entityId: item.id,
      newData: item,
    });

    return item;
  }

  static async update(id: string, data: UpdateWBSDTO, userId?: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hạng mục");

    let level = existing.level;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
        if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
        level = parent.level + 1;
      } else {
        level = 0;
      }
    }

    const oldItem = await prisma.wBSItem.findUnique({ where: { id } });

    const item = await prisma.wBSItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        level,
      },
    });

    await AuditService.log({
      userId,
      action: "UPDATE",
      entity: "WBSItem",
      entityId: item.id,
      oldData: oldItem,
      newData: item,
    });

    return item;
  }

  static async delete(id: string, userId?: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hạng mục");

    const [childCount, costCount, budgetCount] = await Promise.all([
      prisma.wBSItem.count({ where: { parentId: id } }),
      prisma.costRecord.count({ where: { wbsId: id } }),
      prisma.budgetRecord.count({ where: { wbsId: id } })
    ]);

    if (childCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục có hạng mục con. Vui lòng xóa các hạng mục con trước.");
    }

    if (costCount > 0 || budgetCount > 0) {
      throw new ApiError(400, "LỖI NGHIỆP VỤ: Không thể xóa hạng mục WBS đã phát sinh dữ liệu tài chính (Chi phí hoặc Dự toán).", {
        isFinancialLocked: true,
        counts: { costs: costCount, budgets: budgetCount },
        actionSuggested: "ARCHIVE"
      });
    }

    // A. HARD DELETE: WBS node is completely empty
    await prisma.wBSItem.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: "HARD_DELETE",
      entity: "WBSItem",
      entityId: id,
      oldData: existing,
      reason: "Xóa vĩnh viễn (Hard Delete) hạng mục WBS trống.",
    });

    return { ...existing, deletedAt: new Date() }; // Standardized return for React Query
  }
}
