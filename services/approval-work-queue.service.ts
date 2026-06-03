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
  priority: "Bình thường" | "Cao" | "Cần cấp cao";
  dueStatus: "Đúng hạn" | "Sắp đến hạn" | "Quá hạn";
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
  if (ageHours >= OVERDUE_HOURS) return "Quá hạn";
  if (ageHours >= DUE_SOON_HOURS) return "Sắp đến hạn";
  return "Đúng hạn";
}

function getDueAt(createdAt: Date) {
  return new Date(createdAt.getTime() + OVERDUE_HOURS * 60 * 60 * 1000).toISOString();
}

function getPriority(amount: number) {
  if (amount >= HIGH_VALUE_THRESHOLD * 5) return "Cần cấp cao";
  if (amount >= HIGH_VALUE_THRESHOLD) return "Cao";
  return "Bình thường";
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
  if (amount >= HIGH_VALUE_THRESHOLD * 5) return "Giám đốc";
  if (amount >= HIGH_VALUE_THRESHOLD) return "Kế toán trưởng";
  return "Kế toán trưởng";
}

function getCurrentHandler(status: string, amount: number) {
  if (isPendingStatus(status)) return getAssignedRole(amount);
  if (isRejectedStatus(status)) return "Người tạo bổ sung";
  if (isPostedStatus(status)) return "Sổ kế toán";
  if (isApprovedStatus(status)) return "Kế toán ghi sổ";
  return "Người tạo";
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
      throw new ApiError(400, "Chưa xác định được công ty để tải hộp việc phê duyệt.");
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
        documentType: "Hóa đơn",
        docNo: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
        projectId: invoice.projectId,
        projectName: invoice.contract?.project?.name || invoice.wbs?.project?.name || "Chưa có công trình",
        partnerName: invoice.contract?.supplier?.name || "Chưa có khách hàng/NCC",
        creatorId,
        creatorName: invoice.createdBy?.name || invoice.createdBy?.email || "Chưa có dữ liệu",
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
        documentType: "Chi phí",
        docNo: cost.id.slice(0, 8).toUpperCase(),
        projectId: cost.projectId,
        projectName: cost.wbs?.project?.name || "Chưa có công trình",
        partnerName: cost.supplier || "Chưa có nhà cung cấp",
        creatorId,
        creatorName: cost.createdBy?.name || cost.createdBy?.email || "Chưa có dữ liệu",
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
        documentType: "Tạm ứng",
        docNo: advance.advanceNo || advance.id.slice(0, 8).toUpperCase(),
        projectId: advance.projectId,
        projectName: advance.project?.name || "Chưa có công trình",
        partnerName: advance.supplier?.name || "Nhân viên/NCC",
        creatorId,
        creatorName: advance.requester?.name || advance.requester?.email || "Chưa có dữ liệu",
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
        documentType: "Hoàn ứng",
        docNo: settlement.id.slice(0, 8).toUpperCase(),
        projectId: settlement.advanceRequest?.projectId || null,
        projectName: settlement.advanceRequest?.project?.name || "Chưa có công trình",
        partnerName: settlement.advanceRequest?.supplier?.name || "Nhân viên/NCC",
        creatorId,
        creatorName: settlement.creator?.name || settlement.creator?.email || "Chưa có dữ liệu",
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

    const today = new Date();
    const todayPrefix = today.toISOString().slice(0, 10);
    const summaryBase = roleVisibleItems;
    const summary = {
      pendingForMe: summaryBase.filter((item) => isPendingStatus(item.status) && (item.canApprove || item.creatorId === user.id)).length,
      overdue: summaryBase.filter((item) => item.dueStatus === "Quá hạn" && isPendingStatus(item.status)).length,
      dueSoon: summaryBase.filter((item) => item.dueStatus === "Sắp đến hạn" && isPendingStatus(item.status)).length,
      rejectedNeedsFix: summaryBase.filter((item) => isRejectedStatus(item.status)).length,
      approvedToday: summaryBase.filter((item) => isApprovedStatus(item.status) && (item.submittedAt || item.createdAt).startsWith(todayPrefix)).length,
      postedToday: summaryBase.filter((item) => isPostedStatus(item.status) && (item.submittedAt || item.createdAt).startsWith(todayPrefix)).length,
      pendingAmount: summaryBase.filter((item) => isPendingStatus(item.status)).reduce((sum, item) => sum + item.amount, 0),
    };

    const tabbed = applyTabFilter(roleVisibleItems, filters.tab, user).sort((a, b) => {
      if (a.dueStatus === "Quá hạn" && b.dueStatus !== "Quá hạn") return -1;
      if (a.dueStatus !== "Quá hạn" && b.dueStatus === "Quá hạn") return 1;
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
        mode: user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? "Xem toàn bộ trong phạm vi công ty" : "Xem theo vai trò và chứng từ liên quan",
      },
      total: tabbed.length,
      hasMore: tabbed.length > limited.length,
      generatedAt: toIsoOrNull(new Date()),
    };
  }
}
