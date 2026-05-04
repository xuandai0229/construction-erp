import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateWBSDTO, UpdateWBSDTO } from "@/lib/validations";

export interface WBSNodeWithFinancials {
  id: string;
  project_id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  level: number;
  sort_order: number;
  created_at: Date;
  budget_amount: number;
  actual_cost: number;
  revenue: number;
  profit: number;
  cost_variance: number;
  cost_overrun_pct: number;
  is_cost_overrun: boolean;
  children: WBSNodeWithFinancials[];
}

export class WBSService {
  static async findByProject(project_id: string) {
    const [items, costs, budgets, revenues] = await Promise.all([
      prisma.wBSItem.findMany({
        where: { project_id },
        orderBy: [{ level: "asc" }, { sort_order: "asc" }],
      }),
      prisma.costRecord.groupBy({
        by: ["wbs_id"],
        where: { project_id },
        _sum: { amount: true },
      }),
      prisma.budgetRecord.groupBy({
        by: ["wbs_id"],
        where: { project_id },
        _sum: { estimated_amount: true },
      }),
      prisma.revenue.groupBy({
        by: ["wbs_id"],
        where: { project_id },
        _sum: { amount: true },
      }),
    ]);

    const costByWbs = new Map(costs.map(c => [c.wbs_id, c._sum.amount ?? 0]));
    const budgetByWbs = new Map(budgets.map(b => [b.wbs_id, b._sum.estimated_amount ?? 0]));
    const revenueByWbs = new Map(revenues.map(r => [r.wbs_id, r._sum.amount ?? 0]));

    const nodeMap = new Map<string, WBSNodeWithFinancials>();
    for (const item of items) {
      nodeMap.set(item.id, {
        id: item.id,
        project_id: item.project_id,
        name: item.name,
        code: item.code,
        parent_id: item.parent_id,
        level: item.level,
        sort_order: item.sort_order,
        created_at: item.createdAt,
        budget_amount: budgetByWbs.get(item.id) ?? 0,
        actual_cost: costByWbs.get(item.id) ?? 0,
        revenue: revenueByWbs.get(item.id) ?? 0,
        profit: 0,
        cost_variance: 0,
        cost_overrun_pct: 0,
        is_cost_overrun: false,
        children: [],
      });
    }

    const roots: WBSNodeWithFinancials[] = [];
    for (const node of nodeMap.values()) {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const rollUp = (node: WBSNodeWithFinancials): WBSNodeWithFinancials => {
      node.children = node.children.map(rollUp);

      const childBudget = node.children.reduce((s, c) => s + c.budget_amount, 0);
      const childCost = node.children.reduce((s, c) => s + c.actual_cost, 0);
      const childRevenue = node.children.reduce((s, c) => s + c.revenue, 0);

      node.budget_amount += childBudget;
      node.actual_cost += childCost;
      node.revenue += childRevenue;
      node.profit = node.revenue - node.actual_cost;
      node.cost_variance = node.budget_amount - node.actual_cost;
      node.cost_overrun_pct = node.budget_amount > 0
        ? Math.round((node.actual_cost / node.budget_amount) * 1000) / 10
        : 0;
      node.is_cost_overrun = node.actual_cost > node.budget_amount && node.budget_amount > 0;

      return node;
    };

    const tree = roots.map(rollUp);

    const totalBudget = tree.reduce((s, n) => s + n.budget_amount, 0);
    const totalActual = tree.reduce((s, n) => s + n.actual_cost, 0);
    const totalRevenue = tree.reduce((s, n) => s + n.revenue, 0);

    return {
      tree,
      flat: items,
      stats: {
        totalItems: items.length,
        totalBudget,
        totalActual,
        totalRevenue,
        variance: totalBudget - totalActual,
        progress: totalBudget > 0 ? Math.round((totalActual / totalBudget) * 1000) / 10 : 0,
        isCostOverrun: totalActual > totalBudget && totalBudget > 0,
      },
    };
  }

  static async create(data: CreateWBSDTO) {
    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ApiError(404, "Parent WBS item not found");
      if (parent.project_id !== data.projectId) throw new ApiError(400, "Parent must belong to same project");
    }

    let level = 0;
    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      level = (parent?.level ?? 0) + 1;
    }

    return prisma.wBSItem.create({
      data: {
        project_id: data.projectId,
        name: data.name,
        code: data.code ?? null,
        parent_id: data.parentId ?? null,
        level,
        sort_order: data.sortOrder ?? 0,
      },
    });
  }

  static async update(id: string, data: UpdateWBSDTO) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "WBS item not found");

    let level = existing.level;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
        if (!parent) throw new ApiError(404, "Parent WBS item not found");
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
        ...(data.parentId !== undefined && { parent_id: data.parentId }),
        ...(data.sortOrder !== undefined && { sort_order: data.sortOrder }),
        level,
      },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "WBS item not found");

    const childCount = await prisma.wBSItem.count({ where: { parent_id: id } });
    if (childCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục có hạng mục con");
    }

    const costCount = await prisma.costRecord.count({ where: { wbs_id: id } });
    if (costCount > 0) {
      throw new ApiError(400, "Không thể xóa hạng mục đã có chi phí. Hãy xóa chi phí trước.");
    }

    return prisma.wBSItem.delete({ where: { id } });
  }
}
