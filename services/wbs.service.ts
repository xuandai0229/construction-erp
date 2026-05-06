import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateWBSDTO, UpdateWBSDTO } from "@/lib/validations";
import { ProjectFinance } from "./finance/projectFinance";
import { CostRecord, BudgetRecord, WBSItem } from "@/app/types";

export class WBSService {
  static async findByProject(projectId: string) {
    const [items, costGroups, budgetGroups] = await Promise.all([
      prisma.wBSItem.findMany({
        where: { projectId },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.costRecord.groupBy({
        by: ['wbsId'],
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.budgetRecord.groupBy({
        by: ['wbsId'],
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true }
      }),
    ]);

    // Map groups for O(1) lookup during tree build
    const costMap = new Map(costGroups.map(g => [g.wbsId, Number(g._sum.amount || 0)]));
    const budgetMap = new Map(budgetGroups.map(g => [g.wbsId, Number(g._sum.estimatedAmount || 0)]));

    // Use centralized ProjectFinance engine for tree and roll-ups
    // We pass summarized maps instead of raw arrays
    const tree = ProjectFinance.calculateWBSTreeOptimized(
      items as any,
      costMap,
      budgetMap
    );

    const stats = ProjectFinance.calculateStats(tree);

    return {
      tree,
      flat: items,
      stats: {
        totalItems: items.length,
        ...stats,
        isCostOverrun: stats.totalActual > stats.totalBudget && stats.totalBudget > 0,
      },
    };
  }

  static async create(data: CreateWBSDTO) {
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

    return prisma.wBSItem.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        code: data.code ?? null,
        parentId: data.parentId ?? null,
        level,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  static async update(id: string, data: UpdateWBSDTO) {
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

    return prisma.wBSItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        level,
      },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hạng mục");

    const childCount = await prisma.wBSItem.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục có hạng mục con");
    }

    const costCount = await prisma.costRecord.count({ where: { wbsId: id } });
    if (costCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục đã có chi phí. Hãy xóa chi phí trước.");
    }

    return prisma.wBSItem.delete({ where: { id } });
  }
}
