import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateWBSDTO, UpdateWBSDTO } from "@/lib/validations";
import { AuditService } from "./audit.service";
import { ProjectFinance } from "./finance/projectFinance";
import { CostRecord, BudgetRecord, WBSItem } from "@/app/types";

export class WBSService {
  static async findByProject(projectId: string) {
    const [items, costsAgg, budgetsAgg] = await Promise.all([
      prisma.wBSItem.findMany({
        where: { projectId, deletedAt: null },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.costRecord.groupBy({
        by: ["wbsId"],
        where: { projectId, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.budgetRecord.groupBy({
        by: ["wbsId"],
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true },
      }),
    ]);

    // Map aggregated data back to a shape ProjectFinance can use (or just calculate here)
    const costsMap = new Map(costsAgg.map(c => [c.wbsId, Number(c._sum.amount || 0)]));
    const budgetsMap = new Map(budgetsAgg.map(b => [b.wbsId, Number(b._sum.estimatedAmount || 0)]));

    // Convert to a simplified form for calculateWBSTree if possible, 
    // or just pass mock records to satisfy the existing engine without refactoring it.
    const mockCosts = Array.from(costsMap.entries()).map(([wbsId, amount]) => ({ wbsId, amount } as any));
    const mockBudgets = Array.from(budgetsMap.entries()).map(([wbsId, amount]) => ({ wbsId, estimatedAmount: amount } as any));

    const tree = ProjectFinance.calculateWBSTree(
      items as unknown as WBSItem[],
      mockCosts as unknown as CostRecord[],
      mockBudgets as unknown as BudgetRecord[]
    );

    const totalBudget = tree.reduce((s, n) => s + n.budget, 0);
    const totalActual = tree.reduce((s, n) => s + n.actual, 0);

    return {
      tree,
      flat: items,
      stats: {
        totalItems: items.length,
        totalBudget,
        totalActual,
        variance: totalBudget - totalActual,
        progress: totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0,
        isCostOverrun: totalActual > totalBudget && totalBudget > 0,
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

    const childCount = await prisma.wBSItem.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục có hạng mục con");
    }

    const oldItem = await prisma.wBSItem.findUnique({ where: { id } });

    const item = await prisma.wBSItem.update({ 
      where: { id },
      data: { 
        deletedAt: new Date(),
        deletedById: userId,
      }
    });

    await AuditService.log({
      userId,
      action: "DELETE",
      entity: "WBSItem",
      entityId: id,
      oldData: oldItem,
      reason: "User requested soft delete",
    });

    return item;
  }
}
