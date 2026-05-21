import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "./financial-aggregation.service";
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
  }, companyId?: string | null) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.search && {
        name: { contains: params.search, mode: "insensitive" },
      }),
      ...(companyId && { companyId }), // Enforce tenant boundary
      deletedAt: null,
    };

    const orderBy = params.orderBy ?? "createdAt";
    const orderDir = params.orderDir ?? "desc";

    const [projects, total, summary] = await Promise.all([
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
      prisma.project.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: { contractValue: true }
      })
    ]);

    // Flatten summary stats
    const stats = {
      totalValue: summary.reduce((acc, s) => acc + Number(s._sum.contractValue || 0), 0),
      inProgress: summary.find(s => s.status === 'IN_PROGRESS')?._count._all || 0,
      completed: summary.find(s => s.status === 'COMPLETED')?._count._all || 0,
      cancelled: summary.find(s => s.status === 'CANCELLED')?._count._all || 0,
      planned: summary.find(s => s.status === 'PLANNED')?._count._all || 0,
    };

    const projectIds = projects.map(p => p.id);
    const [costsAgg, tasksAgg] = await Promise.all([
      prisma.costRecord.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds }, deletedAt: null },
        _sum: { amount: true }
      }),
      prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: { projectId: { in: projectIds }, deletedAt: null },
        _count: { status: true }
      })
    ]);

    const costMap = new Map(costsAgg.map(c => [c.projectId, Number(c._sum.amount || 0)]));
    const taskMap = new Map<string, { total: number, done: number }>();
    tasksAgg.forEach(t => {
      const current = taskMap.get(t.projectId) || { total: 0, done: 0 };
      current.total += t._count.status;
      if (t.status === 'DONE') current.done += t._count.status;
      taskMap.set(t.projectId, current);
    });

    const enrichedProjects = projects.map(p => {
      const tasks = taskMap.get(p.id) || { total: 0, done: 0 };
      const progress = tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0;
      return {
        ...p,
        totalValue: Number(p.contractValue || 0),
        totalBudget: Number(p.totalBudget || 0),
        actualCost: costMap.get(p.id) || 0,
        progress
      };
    });

    return {
      data: enrichedProjects,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats // Consumed by ProjectCardStats
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

  static async create(data: CreateProjectDTO, userId?: string, companyId?: string | null) {
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
        companyId: companyId ?? undefined,
        ownerId: data.ownerId ?? undefined,
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

    // A. HARD DELETE: Project is empty, clean it completely from DB
    await prisma.$transaction(async (tx) => {
      // Manual cascade delete due to lack of Prisma cascade
      // Level 4 & 3
      const boqs = await tx.bOQItem.findMany({ where: { projectId: id }, select: { id: true } });
      if (boqs.length > 0) {
          const boqIds = boqs.map((b: any) => b.id);
          const progresses = await tx.progressEntry.findMany({ where: { boqItemId: { in: boqIds } }, select: { id: true } });
          const pIds = progresses.map((p: any) => p.id);
          if (pIds.length > 0) await tx.measurement.deleteMany({ where: { progressEntryId: { in: pIds } } });
          await tx.progressEntry.deleteMany({ where: { boqItemId: { in: boqIds } } });
      }
      
      const subcontracts = await tx.subcontract.findMany({ where: { projectId: id }, select: { id: true } });
      if (subcontracts.length > 0) {
          const subIds = subcontracts.map((s: any) => s.id);
          const subItems = await tx.subcontractItem.findMany({ where: { subcontractId: { in: subIds } }, select: { id: true } });
          const subItemIds = subItems.map((si: any) => si.id);
          if (subItemIds.length > 0) await tx.subcontractProgress.deleteMany({ where: { subcontractItemId: { in: subItemIds } } });
          await tx.subcontractItem.deleteMany({ where: { subcontractId: { in: subIds } } });
          await tx.subcontractInvoice.deleteMany({ where: { subcontractId: { in: subIds } } });
      }

      await tx.transactionLine.deleteMany({ where: { journalEntry: { projectId: id } } });
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { projectId: id } } });
      await tx.quotation.deleteMany({ where: { purchaseRequest: { projectId: id } } });
      await tx.contractChange.deleteMany({ where: { contract: { projectId: id } } });
      await tx.approvalStep.deleteMany({ where: { ApprovalRequest: { projectId: id } } });

      // Level 2
      await tx.payment.deleteMany({ where: { projectId: id } });
      await tx.revenue.deleteMany({ where: { projectId: id } });
      await tx.invoice.deleteMany({ where: { projectId: id } });
      await tx.costRecord.deleteMany({ where: { projectId: id } });
      await tx.budgetRecord.deleteMany({ where: { projectId: id } });
      
      await tx.goodsReceipt.deleteMany({ where: { projectId: id } });
      await tx.purchaseOrder.deleteMany({ where: { projectId: id } });
      await tx.purchaseRequest.deleteMany({ where: { projectId: id } });
      
      await tx.contract.deleteMany({ where: { projectId: id } });
      await tx.subcontract.deleteMany({ where: { projectId: id } });
      
      await tx.siteConsumption.deleteMany({ where: { projectId: id } });
      await tx.inventoryTransaction.deleteMany({ where: { projectId: id } });
      await tx.bOQItem.deleteMany({ where: { projectId: id } });
      
      await tx.variationOrder.deleteMany({ where: { projectId: id } });
      await tx.document.deleteMany({ where: { projectId: id } });
      await tx.activityFeed.deleteMany({ where: { projectId: id } });
      await tx.approvalRequest.deleteMany({ where: { projectId: id } });
      await tx.budgetVersion.deleteMany({ where: { projectId: id } });
      await tx.journalEntry.deleteMany({ where: { projectId: id } });

      await tx.siteLog.deleteMany({ where: { projectId: id } });

      // Level 1
      await tx.task.deleteMany({ where: { projectId: id } });
      
      // WBSItem has self-relations. Delete bottom-up safely.
      let wbsCount = await tx.wBSItem.count({ where: { projectId: id } });
      while (wbsCount > 0) {
        await tx.$executeRaw`DELETE FROM "WBSItem" WHERE "projectId" = ${id} AND id NOT IN (SELECT DISTINCT "parentId" FROM "WBSItem" WHERE "parentId" IS NOT NULL AND "projectId" = ${id})`;
        const newCount = await tx.wBSItem.count({ where: { projectId: id } });
        if (newCount === wbsCount) {
          // Fallback if circular reference
          await tx.$executeRaw`DELETE FROM "WBSItem" WHERE "projectId" = ${id}`;
          break;
        }
        wbsCount = newCount;
      }
      
      // Finally, delete the project
      await tx.project.delete({ where: { id } });
    });

    await AuditService.log({
      userId,
      action: "HARD_DELETE",
      entity: "Project",
      entityId: id,
      oldData: oldProject,
      reason: "Xóa vĩnh viễn dự án (Hard Delete)",
    });

    return oldProject;
  }

  static async getAccountingSummary(projectId: string) {
    // const snapshot = await FinancialAggregationService.getProjectSnapshot(projectId);
    
    const [costsAgg, budgetsAgg, revenuesAgg, invoicesAgg, wbsCount, taskStats, purchaseOrdersAgg] = await Promise.all([
      prisma.costRecord.aggregate({
        where: { 
          projectId, 
          deletedAt: null,
          // Relaxing strict approval status to reconcile data visibility
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

    const snapshot = await FinancialAggregationService.getProjectSnapshot(projectId);

    const totalCost = snapshot.reality.actualCost;
    const totalBudget = Number(budgetsAgg._sum?.estimatedAmount || 0);
    const totalRevenue = snapshot.reality.totalRevenue;
    const totalInvoiced = snapshot.reality.totalRevenue;
    const totalPaidInvoice = Number(invoicesAgg._sum?.paidAmount || 0);
    const totalRemainingInvoice = Number(invoicesAgg._sum?.remainingAmount || 0);
    const committedCost = Number(purchaseOrdersAgg._sum?.totalAmount || 0);
    const paidCost = Number(paidCostsAgg._sum?.amount || 0);
    const paidRevenue = Number(paidRevenuesAgg._sum?.amount || 0);

    // [INTEGRITY FIX DEFERRED]: Budget drift sync is moved to a Background Reconciliation Job (Reconciliation Engine)
    // to prevent Race Conditions and database locks during concurrent reads.

    const costByType: Record<string, number> = {};
    costsByType.forEach(c => costByType[c.costType] = Number(c._sum.amount || 0));

    const budgetByType: Record<string, number> = {};
    budgetsByType.forEach(b => budgetByType[b.costType] = Number(b._sum.estimatedAmount || 0));

    const taskBreakdown: Record<string, number> = {};
    taskStats.forEach(t => taskBreakdown[t.status] = t._count.status);

    const totalTasks = Object.values(taskBreakdown).reduce((s, v) => s + v, 0);
    const doneTasks = taskBreakdown["DONE"] ?? 0;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const profit = snapshot.reality.grossProfit;
    const profitMargin = snapshot.reality.grossMargin;
    const costVariance = totalBudget - totalCost;
    const costOverrunPct = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
    const totalExposure = snapshot.exposure.totalCostExposure;
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
      isCostOverrun: snapshot.exposure.isOverBudget,
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
      // Integration metadata
      integrity: snapshot.integrity,
      version: snapshot.version
    };
  }
}
