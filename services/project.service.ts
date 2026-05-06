import { prisma } from "@/lib/prisma";
import { Prisma, ProjectStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { CreateProjectDTO, UpdateProjectDTO } from "@/lib/validations";
import { ProjectFinance } from "./finance/projectFinance";
import { assertValidEntity } from "@/lib/assertion";
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

  static async update(id: string, data: UpdateProjectDTO) {
    assertValidEntity(data, "UpdateProjectDTO");

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

  static async delete(id: string) {
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
    const [costs, budgets, revenues, invoices, wbsCount, taskStats, purchaseOrders] = await Promise.all([
      prisma.costRecord.findMany({
        where: { projectId },
        select: { amount: true, costType: true, status: true },
      }),
      prisma.budgetRecord.findMany({
        where: { projectId },
        select: { estimatedAmount: true, costType: true },
      }),
      prisma.revenue.findMany({
        where: { projectId },
        select: { amount: true, status: true },
      }),
      prisma.invoice.findMany({
        where: { projectId },
        select: { amount: true, paidAmount: true, remainingAmount: true, status: true },
      }),
      prisma.wBSItem.count({ where: { projectId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId, deletedAt: null },
        _count: { status: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { projectId, status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
        select: { totalAmount: true }
      })
    ]);

    return ProjectFinance.calculateProjectStats({
      costs: costs.map(c => ({ ...c, amount: Number(c.amount) })) as unknown as CostRecord[],
      budgets: budgets.map(b => ({ ...b, estimatedAmount: Number(b.estimatedAmount) })) as unknown as BudgetRecord[],
      revenues: revenues.map(r => ({ ...r, amount: Number(r.amount) })) as unknown as RevenueRecord[],
      invoices: invoices.map(i => ({ 
        ...i, 
        amount: Number(i.amount), 
        paidAmount: Number(i.paidAmount), 
        remainingAmount: Number(i.remainingAmount) 
      })) as unknown as InvoiceRecord[],
      committedCosts: purchaseOrders.map(p => ({ amount: Number(p.totalAmount) })),
      wbsCount,
      taskStats,
    });
  }
}
