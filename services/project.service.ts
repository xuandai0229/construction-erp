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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { startDate: true, endDate: true }
    });

    if (!project) throw new ApiError(404, "Project not found");

    const [
      costs, budgets, revenues, invoices, wbsCount, taskStats, committedCosts,
      revenueTrendsRaw, costTrendsRaw
    ] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.budgetRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.revenue.findMany({ where: { projectId, deletedAt: null } }),
      prisma.invoice.findMany({ where: { projectId, deletedAt: null } }),
      prisma.wBSItem.count({ where: { projectId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId, deletedAt: null },
        _count: { status: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { projectId, status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
        select: { totalAmount: true }
      }),
      prisma.revenue.groupBy({
        by: ['date'],
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.costRecord.groupBy({
        by: ['date'],
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      })
    ]);

    // Process Trends
    const trendMap = new Map<string, { month: string; revenue: number; cost: number }>();
    const getMonthStr = (date: Date) => `${date.getMonth() + 1}/${date.getFullYear()}`;

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = getMonthStr(d);
      trendMap.set(key, { month: key, revenue: 0, cost: 0 });
    }

    revenueTrendsRaw.forEach(r => {
      const key = getMonthStr(r.date);
      if (trendMap.has(key)) trendMap.get(key)!.revenue += Number(r._sum.amount || 0);
    });

    costTrendsRaw.forEach(c => {
      const key = getMonthStr(c.date);
      if (trendMap.has(key)) trendMap.get(key)!.cost += Number(c._sum.amount || 0);
    });

    const monthlyTrends = Array.from(trendMap.values());

    // MAP PRISMA -> TYPES
    const mapAmount = (val: any) => Number(val || 0);

    const mappedCosts: CostRecord[] = costs.map(c => ({
      ...c,
      amount: mapAmount(c.amount),
      quantity: mapAmount(c.quantity),
      unitPrice: mapAmount(c.unitPrice),
      date: c.date.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    } as any));

    const mappedBudgets: BudgetRecord[] = budgets.map(b => ({
      ...b,
      estimatedAmount: mapAmount(b.estimatedAmount),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    } as any));

    const mappedRevenues: RevenueRecord[] = revenues.map(r => ({
      ...r,
      amount: mapAmount(r.amount),
      date: r.date.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    } as any));

    const mappedInvoices: InvoiceRecord[] = invoices.map(i => ({
      ...i,
      amount: mapAmount(i.amount),
      paidAmount: mapAmount(i.paidAmount),
      remainingAmount: mapAmount(i.remainingAmount),
      issuedDate: i.issuedDate.toISOString(),
      dueDate: i.dueDate?.toISOString() || null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    } as any));

    const mappedCommittedCosts = committedCosts.map(po => ({
      amount: mapAmount(po.totalAmount)
    }));

    return ProjectFinance.calculateProjectStats({
      costs: mappedCosts,
      budgets: mappedBudgets,
      revenues: mappedRevenues,
      invoices: mappedInvoices,
      committedCosts: mappedCommittedCosts,
      wbsCount,
      taskStats,
      projectDates: {
        start: project.startDate?.toISOString() || null,
        end: project.endDate?.toISOString() || null
      },
      monthlyTrends
    });
  }
}
