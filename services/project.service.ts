import { prisma } from "@/lib/prisma";
import { Prisma, ProjectStatus, UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { CreateProjectDTO, UpdateProjectDTO } from "@/lib/validations";
import { ProjectFinance } from "./finance/projectFinance";
import { assertValidEntity } from "@/lib/assertion";
import { RBAC, AppAction } from "@/lib/rbac";
import { 
  CostRecord, BudgetRecord, RevenueRecord, InvoiceRecord 
} from "@/app/types";

export class ProjectService {
  private static round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

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
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!project) throw new ApiError(404, "Project not found");
    return project;
  }

  static async create(data: CreateProjectDTO) {
    assertValidEntity(data, "CreateProjectDTO");

    if (data.ownerId) {
      const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
      if (!user) throw new ApiError(404, "Owner (User) not found");
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.PLANNED,
        contractValue: this.round(data.contractValue ?? 0),
        totalBudget: this.round(data.totalBudget ?? 0),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  static async update(id: string, data: UpdateProjectDTO, actor?: { userId: string, userRole: UserRole }) {
    assertValidEntity(data, "UpdateProjectDTO");

    // ─── AUTHORIZATION ──────────────────────────────────
    if (actor) {
      await RBAC.authorize({
        userId: actor.userId,
        userRole: actor.userRole,
        action: AppAction.PROJECT_UPDATE,
        projectId: id
      });
    }

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
        ...(data.contractValue !== undefined && { contractValue: this.round(data.contractValue) }),
        ...(data.totalBudget !== undefined && { totalBudget: this.round(data.totalBudget) }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.ownerId !== undefined && {
          owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
        }),
      },
    });
  }

  static async delete(id: string, actor?: { userId: string, userRole: UserRole }) {
    // ─── AUTHORIZATION ──────────────────────────────────
    if (actor) {
      await RBAC.authorize({
        userId: actor.userId,
        userRole: actor.userRole,
        action: AppAction.PROJECT_DELETE,
        projectId: id
      });
    }
    // Financial Safety Check: Don't delete if there are invoices or costs
    const [invoiceCount, costCount] = await Promise.all([
      prisma.invoice.count({ where: { projectId: id } }),
      prisma.costRecord.count({ where: { projectId: id } })
    ]);

    if (invoiceCount > 0 || costCount > 0) {
      throw new ApiError(400, "Không thể xóa dự án đã có dữ liệu tài chính (Hóa đơn hoặc Chi phí).");
    }

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

  static async getAccountingSummary(projectId: string) {
    const [
      costStats,
      costByTypeRaw,
      budgetStats,
      budgetByTypeRaw,
      revenueStats,
      invoiceStats,
      wbsCount,
      taskStats,
      poStats
    ] = await Promise.all([
      // 1. Costs
      prisma.costRecord.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.costRecord.groupBy({
        by: ['costType', 'status'],
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      // 2. Budgets
      prisma.budgetRecord.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true }
      }),
      prisma.budgetRecord.groupBy({
        by: ['costType'],
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true }
      }),
      // 3. Revenues
      prisma.revenue.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      // 4. Invoices
      prisma.invoice.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true, paidAmount: true, remainingAmount: true },
        _count: { id: true }
      }),
      // 5. WBS & Tasks
      prisma.wBSItem.count({ where: { projectId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId, deletedAt: null },
        _count: { status: true },
      }),
      // 6. Purchase Orders
      prisma.purchaseOrder.aggregate({
        where: { projectId, status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
        _sum: { totalAmount: true }
      })
    ]);

    // Format results to match DashboardStats interface
    const totalCost = Number(costStats._sum.amount || 0);
    const paidCost = costByTypeRaw
      .filter(c => c.status === 'paid')
      .reduce((s, c) => s + Number(c._sum.amount || 0), 0);
    const unpaidCost = totalCost - paidCost;

    const costByType: Record<string, number> = {};
    costByTypeRaw.forEach(c => {
      costByType[c.costType] = (costByType[c.costType] || 0) + Number(c._sum.amount || 0);
    });

    const totalBudget = Number(budgetStats._sum.estimatedAmount || 0);
    const budgetByType: Record<string, number> = {};
    budgetByTypeRaw.forEach(b => {
      budgetByType[b.costType] = Number(b._sum.estimatedAmount || 0);
    });

    const totalRevenue = Number(revenueStats._sum.amount || 0);
    const totalInvoiced = Number(invoiceStats._sum.amount || 0);
    const totalPaidInvoice = Number(invoiceStats._sum.paidAmount || 0);
    const totalRemainingInvoice = Number(invoiceStats._sum.remainingAmount || 0);

    const committedCost = Number(poStats._sum.totalAmount || 0);
    
    const taskBreakdown: Record<string, number> = {};
    taskStats.forEach(t => taskBreakdown[t.status] = t._count.status);
    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      totalCost,
      paidCost,
      unpaidCost,
      costByType,
      totalBudget,
      budgetByType,
      costVariance: totalBudget - totalCost,
      costOverrunPct: totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0,
      isCostOverrun: totalCost > totalBudget && totalBudget > 0,
      totalRevenue,
      totalInvoiced,
      totalPaidInvoice,
      totalRemainingInvoice,
      overdueInvoices: 0, // Need dueDate check for real overdue logic
      profit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      taskProgress,
      taskBreakdown,
      wbsCount,
      committedCost,
      totalExposure: totalCost + committedCost,
      budgetRemaining: totalBudget - (totalCost + committedCost),
    };
  }
}
