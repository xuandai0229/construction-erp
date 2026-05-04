import { prisma } from "@/lib/prisma";
import { Prisma, ProjectStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { CreateProjectDTO, UpdateProjectDTO } from "@/lib/validations";

export class ProjectService {
  // ─── LIST ───────────────────────────────────────────
  static async findMany(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProjectStatus;
    orderBy?: "createdAt" | "name";
    orderDir?: "asc" | "desc";
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.search && {
        name: { contains: params.search, mode: "insensitive" },
      }),
      deletedAt: null,
    };

    const orderBy = params.orderBy ?? "createdAt";
    const orderDir = params.orderDir ?? "desc";

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDir },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, wbsItems: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          },
        },
        wbsItems: {
          include: {
            budgets: true,
            costs: true,
          },
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (!project) throw new ApiError(404, "Project not found");
    return project;
  }

  static async create(data: CreateProjectDTO) {
    if (data.ownerId) {
      const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
      if (!user) throw new ApiError(404, "Owner (User) not found");
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.PLANNED,
        contract_value: data.contractValue ?? 0,
        total_budget: data.totalBudget ?? 0,
        start_date: data.startDate ? new Date(data.startDate) : null,
        end_date: data.endDate ? new Date(data.endDate) : null,
        ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  static async update(id: string, data: UpdateProjectDTO) {
    if (data.ownerId) {
      const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
      if (!user) throw new ApiError(404, "Owner (User) not found");
    }

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.contractValue !== undefined && { contract_value: data.contractValue }),
        ...(data.totalBudget !== undefined && { total_budget: data.totalBudget }),
        ...(data.startDate !== undefined && { start_date: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { end_date: data.endDate ? new Date(data.endDate) : null }),
        ...(data.ownerId !== undefined && {
          owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
        }),
      },
    });
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { projectId: id },
        data: { deletedAt: new Date() },
      });
      return tx.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  static async getAccountingSummary(project_id: string) {
    const [costs, budgets, revenues, invoices, wbs_count, task_stats] = await Promise.all([
      prisma.costRecord.findMany({
        where: { project_id },
        select: { amount: true, cost_type: true, status: true },
      }),
      prisma.budgetRecord.findMany({
        where: { project_id },
        select: { estimated_amount: true, cost_type: true },
      }),
      prisma.revenue.findMany({
        where: { project_id },
        select: { amount: true, status: true },
      }),
      prisma.invoice.findMany({
        where: { project_id },
        select: { amount: true, paid_amount: true, remaining_amount: true, status: true },
      }),
      prisma.wBSItem.count({ where: { project_id } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId: project_id, deletedAt: null },
        _count: { status: true },
      }),
    ]);

    const total_cost = costs.reduce((s, c) => s + c.amount, 0);
    const paid_cost = costs.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);
    const unpaid_cost = total_cost - paid_cost;

    const cost_by_type: Record<string, number> = {};
    for (const c of costs) {
      cost_by_type[c.cost_type] = (cost_by_type[c.cost_type] ?? 0) + c.amount;
    }

    const total_budget = budgets.reduce((s, b) => s + b.estimated_amount, 0);
    const budget_by_type: Record<string, number> = {};
    for (const b of budgets) {
      budget_by_type[b.cost_type] = (budget_by_type[b.cost_type] ?? 0) + b.estimated_amount;
    }

    const total_revenue = revenues.reduce((s, r) => s + r.amount, 0);
    const paid_revenue = revenues.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);
    const unpaid_revenue = total_revenue - paid_revenue;

    const total_invoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const total_paid_invoice = invoices.reduce((s, i) => s + i.paid_amount, 0);
    const total_remaining_invoice = invoices.reduce((s, i) => s + i.remaining_amount, 0);
    const overdue_count = invoices.filter(i => i.status === "OVERDUE").length;

    const profit = total_revenue - total_cost;
    const profit_margin = total_revenue > 0 ? (profit / total_revenue) * 100 : 0;
    const cost_variance = total_budget - total_cost;
    const cost_overrun_pct = total_budget > 0 ? ((total_cost / total_budget) * 100) : 0;

    const task_breakdown: Record<string, number> = {};
    for (const t of task_stats) {
      task_breakdown[t.status] = t._count.status;
    }
    const total_tasks = Object.values(task_breakdown).reduce((s, v) => s + v, 0);
    const done_tasks = task_breakdown["DONE"] ?? 0;
    const task_progress = total_tasks > 0 ? Math.round((done_tasks / total_tasks) * 100) : 0;

    return {
      total_cost,
      paid_cost,
      unpaid_cost,
      cost_by_type,
      total_budget,
      budget_by_type,
      cost_variance,
      cost_overrun_pct: Math.round(cost_overrun_pct * 10) / 10,
      is_cost_overrun: total_cost > total_budget && total_budget > 0,
      total_revenue,
      paid_revenue,
      unpaid_revenue,
      total_invoiced,
      total_paid_invoice,
      total_remaining_invoice,
      overdue_invoices: overdue_count,
      profit,
      profit_margin: Math.round(profit_margin * 10) / 10,
      task_progress,
      task_breakdown,
      wbs_count,
    };
  }
}
