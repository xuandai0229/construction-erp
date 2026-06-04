import { ApiError } from "@/lib/api-error";
import { RBAC } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { UserRole } from "../generated/prisma-client";

export type ApprovalQueueModule = "INVOICE" | "COST" | "ADVANCE" | "SETTLEMENT";
export type ApprovalQueueTab = "pending" | "created" | "rejected" | "approved" | "posted" | "all";

export interface ApprovalQueueItem {
  id: string;
  module: ApprovalQueueModule;
  documentType: string;
  docNo: string;
  projectId: string | null;
  projectName: string;
  partnerName: string;
  creatorId: string | null;
  creatorName: string;
  createdAt: string;
  submittedAt: string | null;
  amount: number;
  status: string;
  priority: "B\u00ecnh th\u01b0\u1eddng" | "Cao" | "C\u1ea7n c\u1ea5p cao";
  dueStatus: "\u0110\u00fang h\u1ea1n" | "S\u1eafp \u0111\u1ebfn h\u1ea1n" | "Qu\u00e1 h\u1ea1n";
  dueAt: string;
  assignedRole: string;
  currentHandler: string;
  canApprove: boolean;
  canReject: boolean;
  sourceEntity: string;
}

interface WorkQueueUser {
  id: string;
  role: UserRole;
  companyId: string | null;
}

interface WorkQueueFilters {
  tab?: ApprovalQueueTab;
  status?: string | null;
  documentType?: string | null;
  projectId?: string | null;
  createdBy?: string | null;
  assignedToMe?: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
}

const HIGH_VALUE_THRESHOLD = 50_000_000;
const DUE_SOON_HOURS = 48;
const OVERDUE_HOURS = 72;

function normalizeLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit) || limit <= 0) return 50;
  return Math.min(Math.floor(limit), 50);
}

function getTargetCompanyId(user: WorkQueueUser, fallbackCompanyId?: string | null) {
  if (user.companyId) return user.companyId;
  return fallbackCompanyId || null;
}

function getDueStatus(createdAt: Date) {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (ageHours >= OVERDUE_HOURS) return "Qu\u00e1 h\u1ea1n";
  if (ageHours >= DUE_SOON_HOURS) return "S\u1eafp \u0111\u1ebfn h\u1ea1n";
  return "\u0110\u00fang h\u1ea1n";
}

function getDueAt(createdAt: Date) {
  return new Date(createdAt.getTime() + OVERDUE_HOURS * 60 * 60 * 1000).toISOString();
}

function getPriority(amount: number) {
  if (amount >= HIGH_VALUE_THRESHOLD * 5) return "C\u1ea7n c\u1ea5p cao";
  if (amount >= HIGH_VALUE_THRESHOLD) return "Cao";
  return "B\u00ecnh th\u01b0\u1eddng";
}

function isPendingStatus(status: string) {
  return ["PENDING", "SUBMITTED"].includes(status.toUpperCase());
}

function isApprovedStatus(status: string) {
  return ["APPROVED", "PAID", "FULLY_SETTLED", "PARTIALLY_SETTLED"].includes(status.toUpperCase());
}

function isPostedStatus(status: string) {
  return ["POSTED", "PAID", "FULLY_SETTLED", "PARTIALLY_SETTLED"].includes(status.toUpperCase());
}

function isRejectedStatus(status: string) {
  return ["REJECTED", "CANCELLED"].includes(status.toUpperCase());
}

function getAssignedRole(amount: number) {
  if (amount >= HIGH_VALUE_THRESHOLD * 5) return "Gi\u00e1m \u0111\u1ed1c";
  return "K\u1ebf to\u00e1n tr\u01b0\u1edfng";
}

function getCurrentHandler(status: string, amount: number) {
  if (isPendingStatus(status)) return getAssignedRole(amount);
  if (isRejectedStatus(status)) return "Ng\u01b0\u1eddi t\u1ea1o b\u1ed5 sung";
  if (isPostedStatus(status)) return "S\u1ed5 k\u1ebf to\u00e1n";
  if (isApprovedStatus(status)) return "K\u1ebf to\u00e1n ghi s\u1ed5";
  return "Ng\u01b0\u1eddi t\u1ea1o";
}

function canUserApprove(user: WorkQueueUser, creatorId: string | null, amount: number, module: ApprovalQueueModule, status: string) {
  if (!isPendingStatus(status)) return false;
  if (creatorId && creatorId === user.id) return false;
  const rbacModule = module === "COST" ? "COST" : module === "INVOICE" ? "INVOICE" : "VOUCHER";
  if (!RBAC.hasPermission(user.role, rbacModule, "APPROVE")) return false;
  const limit = RBAC.getFinancialLimit(user.role);
  return limit === Infinity || amount <= limit || user.role === "GROUP_DIRECTOR" || user.role === "SUPER_ADMIN" || user.role === "ADMIN";
}

function applyTabFilter(items: ApprovalQueueItem[], tab: ApprovalQueueTab | undefined, user: WorkQueueUser) {
  switch (tab || "pending") {
    case "pending":
      return items.filter((item) => isPendingStatus(item.status));
    case "created":
      return items.filter((item) => item.creatorId === user.id);
    case "rejected":
      return items.filter((item) => isRejectedStatus(item.status));
    case "approved":
      return items.filter((item) => isApprovedStatus(item.status));
    case "posted":
      return items.filter((item) => isPostedStatus(item.status));
    case "all":
      return items;
    default:
      return items;
  }
}

function applyRoleVisibility(items: ApprovalQueueItem[], user: WorkQueueUser) {
  const canApproveAny =
    RBAC.hasPermission(user.role, "COST", "APPROVE") ||
    RBAC.hasPermission(user.role, "INVOICE", "APPROVE") ||
    RBAC.hasPermission(user.role, "VOUCHER", "APPROVE");

  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "CFO" || user.role === "GROUP_DIRECTOR" || canApproveAny) {
    return items;
  }

  return items.filter((item) => item.creatorId === user.id || isRejectedStatus(item.status));
}

function toIsoOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export class ApprovalWorkQueueService {
  static async getWorkQueue(user: WorkQueueUser, filters: WorkQueueFilters = {}) {
    const fallbackCompany = user.companyId ? null : await prisma.company.findFirst({ select: { id: true } });
    const targetCompanyId = getTargetCompanyId(user, fallbackCompany?.id);
    if (!targetCompanyId) {
      throw new ApiError(400, "Ch\u01b0a x\u00e1c \u0111\u1ecbnh \u0111\u01b0\u1ee3c c\u00f4ng ty \u0111\u1ec3 t\u1ea3i h\u1ed9p vi\u1ec7c ph\u00ea duy\u1ec7t.");
    }

    const dateFilter = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [invoices, costs, advances, settlements] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          ...(filters.projectId ? { projectId: filters.projectId } : {}),
          ...(filters.createdBy ? { createdById: filters.createdBy } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { createdBy: true, contract: { include: { project: true, supplier: true } }, wbs: { include: { project: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.costRecord.findMany({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          ...(filters.projectId ? { projectId: filters.projectId } : {}),
          ...(filters.createdBy ? { createdById: filters.createdBy } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { createdBy: true, wbs: { include: { project: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.advanceRequest.findMany({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          ...(filters.projectId ? { projectId: filters.projectId } : {}),
          ...(filters.createdBy ? { requestedBy: filters.createdBy } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { requester: true, project: true, supplier: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.advanceSettlement.findMany({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { creator: true, advanceRequest: { include: { project: true, supplier: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const items: ApprovalQueueItem[] = [];

    for (const invoice of invoices) {
      const amount = Number(invoice.amount);
      const status = invoice.approvalStatus;
      const creatorId = invoice.createdById || null;
      items.push({
        id: invoice.id,
        module: "INVOICE",
        documentType: "H\u00f3a \u0111\u01a1n",
        docNo: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
        projectId: invoice.projectId,
        projectName: invoice.contract?.project?.name || invoice.wbs?.project?.name || "Ch\u01b0a c\u00f3 c\u00f4ng tr\u00ecnh",
        partnerName: invoice.contract?.supplier?.name || "Ch\u01b0a c\u00f3 kh\u00e1ch h\u00e0ng/NCC",
        creatorId,
        creatorName: invoice.createdBy?.name || invoice.createdBy?.email || "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u",
        createdAt: invoice.createdAt.toISOString(),
        submittedAt: invoice.updatedAt.toISOString(),
        amount,
        status,
        priority: getPriority(amount),
        dueStatus: getDueStatus(invoice.createdAt),
        dueAt: getDueAt(invoice.createdAt),
        assignedRole: getAssignedRole(amount),
        currentHandler: getCurrentHandler(status, amount),
        canApprove: canUserApprove(user, creatorId, amount, "INVOICE", status),
        canReject: canUserApprove(user, creatorId, amount, "INVOICE", status),
        sourceEntity: "Invoice",
      });
    }

    for (const cost of costs) {
      const amount = Number(cost.amount);
      const status = cost.approvalStatus;
      const creatorId = cost.createdById || null;
      items.push({
        id: cost.id,
        module: "COST",
        documentType: "Chi ph\u00ed",
        docNo: cost.id.slice(0, 8).toUpperCase(),
        projectId: cost.projectId,
        projectName: cost.wbs?.project?.name || "Ch\u01b0a c\u00f3 c\u00f4ng tr\u00ecnh",
        partnerName: cost.supplier || "Ch\u01b0a c\u00f3 nh\u00e0 cung c\u1ea5p",
        creatorId,
        creatorName: cost.createdBy?.name || cost.createdBy?.email || "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u",
        createdAt: cost.createdAt.toISOString(),
        submittedAt: cost.updatedAt.toISOString(),
        amount,
        status,
        priority: getPriority(amount),
        dueStatus: getDueStatus(cost.createdAt),
        dueAt: getDueAt(cost.createdAt),
        assignedRole: getAssignedRole(amount),
        currentHandler: getCurrentHandler(status, amount),
        canApprove: canUserApprove(user, creatorId, amount, "COST", status),
        canReject: canUserApprove(user, creatorId, amount, "COST", status),
        sourceEntity: "CostRecord",
      });
    }

    for (const advance of advances) {
      const amount = Number(advance.amount);
      const status = advance.status;
      const creatorId = advance.requestedBy || null;
      items.push({
        id: advance.id,
        module: "ADVANCE",
        documentType: "T\u1ea1m \u1ee9ng",
        docNo: advance.advanceNo || advance.id.slice(0, 8).toUpperCase(),
        projectId: advance.projectId,
        projectName: advance.project?.name || "Ch\u01b0a c\u00f3 c\u00f4ng tr\u00ecnh",
        partnerName: advance.supplier?.name || "Nh\u00e2n vi\u00ean/NCC",
        creatorId,
        creatorName: advance.requester?.name || advance.requester?.email || "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u",
        createdAt: advance.createdAt.toISOString(),
        submittedAt: advance.updatedAt.toISOString(),
        amount,
        status,
        priority: getPriority(amount),
        dueStatus: getDueStatus(advance.createdAt),
        dueAt: getDueAt(advance.createdAt),
        assignedRole: getAssignedRole(amount),
        currentHandler: getCurrentHandler(status, amount),
        canApprove: canUserApprove(user, creatorId, amount, "ADVANCE", status),
        canReject: canUserApprove(user, creatorId, amount, "ADVANCE", status),
        sourceEntity: "AdvanceRequest",
      });
    }

    for (const settlement of settlements) {
      const amount = Number(settlement.amount);
      const status = settlement.status;
      const creatorId = settlement.createdBy || null;
      items.push({
        id: settlement.id,
        module: "SETTLEMENT",
        documentType: "Ho\u00e0n \u1ee9ng",
        docNo: settlement.id.slice(0, 8).toUpperCase(),
        projectId: settlement.advanceRequest?.projectId || null,
        projectName: settlement.advanceRequest?.project?.name || "Ch\u01b0a c\u00f3 c\u00f4ng tr\u00ecnh",
        partnerName: settlement.advanceRequest?.supplier?.name || "Nh\u00e2n vi\u00ean/NCC",
        creatorId,
        creatorName: settlement.creator?.name || settlement.creator?.email || "Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u",
        createdAt: settlement.createdAt.toISOString(),
        submittedAt: settlement.updatedAt.toISOString(),
        amount,
        status,
        priority: getPriority(amount),
        dueStatus: getDueStatus(settlement.createdAt),
        dueAt: getDueAt(settlement.createdAt),
        assignedRole: getAssignedRole(amount),
        currentHandler: getCurrentHandler(status, amount),
        canApprove: canUserApprove(user, creatorId, amount, "SETTLEMENT", status),
        canReject: canUserApprove(user, creatorId, amount, "SETTLEMENT", status),
        sourceEntity: "AdvanceSettlement",
      });
    }

    const roleVisibleItems = applyRoleVisibility(items, user)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter((item) => !filters.documentType || item.module === filters.documentType)
      .filter((item) => !filters.assignedToMe || item.canApprove || item.creatorId === user.id);

    const todayPrefix = new Date().toISOString().slice(0, 10);
    const summaryBase = roleVisibleItems;
    const summary = {
      pendingForMe: summaryBase.filter((item) => isPendingStatus(item.status) && (item.canApprove || item.creatorId === user.id)).length,
      overdue: summaryBase.filter((item) => item.dueStatus === "Qu\u00e1 h\u1ea1n" && isPendingStatus(item.status)).length,
      dueSoon: summaryBase.filter((item) => item.dueStatus === "S\u1eafp \u0111\u1ebfn h\u1ea1n" && isPendingStatus(item.status)).length,
      rejectedNeedsFix: summaryBase.filter((item) => isRejectedStatus(item.status)).length,
      approvedToday: summaryBase.filter((item) => isApprovedStatus(item.status) && (item.submittedAt || item.createdAt).startsWith(todayPrefix)).length,
      postedToday: summaryBase.filter((item) => isPostedStatus(item.status) && (item.submittedAt || item.createdAt).startsWith(todayPrefix)).length,
      pendingAmount: summaryBase.filter((item) => isPendingStatus(item.status)).reduce((sum, item) => sum + item.amount, 0),
    };

    const tabbed = applyTabFilter(roleVisibleItems, filters.tab, user).sort((a, b) => {
      if (a.dueStatus === "Qu\u00e1 h\u1ea1n" && b.dueStatus !== "Qu\u00e1 h\u1ea1n") return -1;
      if (a.dueStatus !== "Qu\u00e1 h\u1ea1n" && b.dueStatus === "Qu\u00e1 h\u1ea1n") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const limit = normalizeLimit(filters.limit);
    const limited = tabbed.slice(0, limit);

    return {
      items: limited,
      summary,
      role: user.role,
      roleBehavior: {
        canApprove: RBAC.hasPermission(user.role, "VOUCHER", "APPROVE") || RBAC.hasPermission(user.role, "COST", "APPROVE") || RBAC.hasPermission(user.role, "INVOICE", "APPROVE"),
        mode: user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? "Xem to\u00e0n b\u1ed9 trong ph\u1ea1m vi c\u00f4ng ty" : "Xem theo vai tr\u00f2 v\u00e0 ch\u1ee9ng t\u1eeb li\u00ean quan",
      },
      total: tabbed.length,
      hasMore: tabbed.length > limited.length,
      generatedAt: toIsoOrNull(new Date()),
    };
  }
}
