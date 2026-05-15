import { prisma } from "@/lib/prisma";
import { Prisma, ProjectStatus, ApprovalStatus } from "../generated/prisma-client";
import { AuditService } from "./audit.service";
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

    if (!project) throw new ApiError(404, "Không tìm thấy dự án");
    return project;
  }

  static async create(data: CreateProjectDTO, userId?: string) {
    assertValidEntity(data, "CreateProjectDTO");

    if (data.ownerId) {
      const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
      if (!user) throw new ApiError(404, "Không tìm thấy người phụ trách dự án");
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.PLANNED,
        contractValue: this.round(data.contractValue ?? 0),
        totalBudget: this.round(data.totalBudget ?? 0),
        investor: data.investor,
        projectType: data.projectType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "Project",
      entityId: project.id,
      newData: project,
    });

    return project;
  }

  static async update(id: string, data: UpdateProjectDTO, userId?: string) {
    assertValidEntity(data, "UpdateProjectDTO");

    if (data.ownerId) {
      const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
      if (!user) throw new ApiError(404, "Không tìm thấy người phụ trách dự án");
    }

    const oldProject = await this.findById(id);

    // Optimistic Locking Check
    if (data.version !== undefined && oldProject.version !== data.version) {
      throw new ApiError(409, "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang.");
    }

    const project = await prisma.project.update({
      where: { id, version: data.version }, // Ensure we only update if version matches
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.contractValue !== undefined && { contractValue: this.round(data.contractValue) }),
        ...(data.totalBudget !== undefined && { totalBudget: this.round(data.totalBudget) }),
        ...(data.investor !== undefined && { investor: data.investor }),
        ...(data.projectType !== undefined && { projectType: data.projectType }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.ownerId !== undefined && {
          owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
        }),
        version: { increment: 1 } // Increment version
      },
    });

    await AuditService.log({
      userId,
      action: "UPDATE",
      entity: "Project",
      entityId: project.id,
      oldData: oldProject,
      newData: project,
    });

    return project;
  }

  static async delete(id: string, userId?: string) {
    const oldProject = await this.findById(id);

    // Financial Safety Check
    const [invoiceCount, costCount, revenueCount] = await Promise.all([
      prisma.invoice.count({ where: { projectId: id } }),
      prisma.costRecord.count({ where: { projectId: id } }),
      prisma.revenue.count({ where: { projectId: id } })
    ]);

    const hasFinancialData = invoiceCount > 0 || costCount > 0 || revenueCount > 0;

    if (hasFinancialData) {
      // B. DATA GOVERNANCE: Prevent Hard Delete, return structured metadata
      throw new ApiError(400, "Không thể xóa dự án đã phát sinh dữ liệu tài chính (Hóa đơn, Chi phí, Doanh thu).", {
        isFinancialLocked: true,
        counts: { invoices: invoiceCount, costs: costCount, revenues: revenueCount },
        actionSuggested: "ARCHIVE"
      });
    }

    // A. HARD DELETE: Project is empty, clean it completely from DB
    await prisma.$transaction([
      // Clean up children first
      prisma.task.deleteMany({ where: { projectId: id } }),
      prisma.budgetRecord.deleteMany({ where: { projectId: id } }),
      prisma.costRecord.deleteMany({ where: { projectId: id } }),
      prisma.wBSItem.deleteMany({ where: { projectId: id } }),
      // Finally delete the project
      prisma.project.delete({ where: { id } })
    ]);

    await AuditService.log({
      userId,
      action: "HARD_DELETE",
      entity: "Project",
      entityId: id,
      oldData: oldProject,
      reason: "Xóa vĩnh viễn dự án (Hard Delete) do chưa phát sinh nghiệp vụ.",
    });

    return { ...oldProject, deletedAt: new Date() }; // Return standard shape for frontend success handlers
  }

  static async restore(id: string, userId?: string) {
    const project = await prisma.project.update({
      where: { id },
      data: { 
        deletedAt: null,
        deletedById: null,
      }
    });

    await AuditService.log({
      userId,
      action: "RESTORE",
      entity: "Project",
      entityId: id,
      newData: project,
    });

    return project;
  }

  static async getAccountingSummary(projectId: string) {
    const [costsAgg, budgetsAgg, revenuesAgg, invoicesAgg, wbsCount, taskStats, purchaseOrdersAgg] = await Promise.all([
       prisma.costRecord.aggregate({
        where: { 
          projectId, 
          deletedAt: null,
          approvalStatus: "APPROVED", // Construction Semantic: Realized cost once approved
          wbs: { deletedAt: null } 
        },
        _sum: { amount: true },
      }),
       prisma.budgetRecord.aggregate({
        where: { 
          projectId, 
          deletedAt: null,
          wbs: { deletedAt: null } // SME Rule: Exclude orphans
        },
        _sum: { estimatedAmount: true },
      }),
      prisma.revenue.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true, paidAmount: true, remainingAmount: true },
      }),
      prisma.wBSItem.count({ where: { projectId, deletedAt: null } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId, deletedAt: null },
        _count: { status: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { projectId, status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] }, deletedAt: null },
        _sum: { totalAmount: true }
      })
    ]);

    // Extra: Get grouped costs and budgets by type for breakdown
    const [costsByType, budgetsByType, paidCostsAgg, paidRevenuesAgg] = await Promise.all([
      prisma.costRecord.groupBy({
        by: ["costType"],
        where: { projectId, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.budgetRecord.groupBy({
        by: ["costType"],
        where: { projectId, deletedAt: null },
        _sum: { estimatedAmount: true }
      }),
      prisma.costRecord.aggregate({
        where: { projectId, status: "paid", deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.revenue.aggregate({
        where: { projectId, status: "paid", deletedAt: null },
        _sum: { amount: true }
      })
    ]);

    const overdueCount = await prisma.invoice.count({
      where: { projectId, status: "OVERDUE", deletedAt: null }
    });

    const totalCost = Number(costsAgg._sum?.amount || 0);
    const totalBudget = Number(budgetsAgg._sum?.estimatedAmount || 0);
    const totalInvoiced = Number(invoicesAgg._sum?.amount || 0);
    const totalRevenue = totalInvoiced; // Accrual Revenue
    const totalPaidInvoice = Number(invoicesAgg._sum?.paidAmount || 0);
    const totalRemainingInvoice = Number(invoicesAgg._sum?.remainingAmount || 0);
    const committedCost = Number(purchaseOrdersAgg._sum?.totalAmount || 0);
    const paidCost = Number(paidCostsAgg._sum?.amount || 0);
    const paidRevenue = Number(paidRevenuesAgg._sum?.amount || 0);

    // [INTEGRITY FIX]: Sync Project.totalBudget if drift detected
    const prj = await prisma.project.findUnique({ where: { id: projectId }, select: { totalBudget: true } });
    if (prj && Math.abs(Number(prj.totalBudget || 0) - totalBudget) > 0.01) {
      await prisma.project.update({
        where: { id: projectId },
        data: { totalBudget: totalBudget }
      });
    }

    const costByType: Record<string, number> = {};
    costsByType.forEach(c => costByType[c.costType] = Number(c._sum.amount || 0));

    const budgetByType: Record<string, number> = {};
    budgetsByType.forEach(b => budgetByType[b.costType] = Number(b._sum.estimatedAmount || 0));

    const taskBreakdown: Record<string, number> = {};
    taskStats.forEach(t => taskBreakdown[t.status] = t._count.status);

    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const costVariance = totalBudget - totalCost;
    const costOverrunPct = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
    const totalExposure = totalCost + committedCost;
    const budgetRemaining = totalBudget - totalExposure;

    return {
      totalCost,
      paidCost,
      unpaidCost: totalCost - paidCost,
      costByType,
      totalBudget,
      budgetByType,
      costVariance,
      costOverrunPct,
      isCostOverrun: totalCost > totalBudget && totalBudget > 0,
      totalRevenue,
      paidRevenue,
      unpaidRevenue: totalRevenue - paidRevenue,
      totalInvoiced,
      totalPaidInvoice,
      totalRemainingInvoice,
      overdueInvoices: overdueCount,
      profit,
      profitMargin,
      taskProgress,
      taskBreakdown,
      wbsCount,
      committedCost,
      totalExposure,
      budgetRemaining,
    };
  }
}
