import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "./audit.service";
import { LoggerService } from "./logger.service";
import { RevenueService } from "./revenue.service";
import { AdvanceService } from "./advance.service";

export interface PendingDoc {
  id: string;
  module: "INVOICE" | "COST" | "ADVANCE" | "SETTLEMENT" | "VOUCHER";
  docNo: string;
  projectId: string;
  projectName: string;
  amount: number;
  createdById: string;
  creatorName: string;
  createdAt: Date;
  status: string;
  comment?: string;
}

export class ApprovalInboxService {
  /**
   * Lấy toàn bộ chứng từ chờ duyệt cho user hiện tại (phân quyền công ty/dự án)
   */
  static async getPendingInbox(user: { id: string; role: string; companyId: string | null }) {
    let targetCompanyId = user.companyId;
    if (!targetCompanyId) {
      const cmp = await prisma.company.findFirst();
      targetCompanyId = cmp?.id || null;
    }
    if (!targetCompanyId) {
      throw new ApiError(400, "User must belong to a company");
    }

    // 1. Lấy Invoices chờ duyệt
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: targetCompanyId,
        approvalStatus: "PENDING",
        deletedAt: null
      },
      include: {
        createdBy: true,
        contract: {
          include: {
            project: true
          }
        }
      }
    });

    // 2. Lấy Costs chờ duyệt
    const costs = await prisma.costRecord.findMany({
      where: {
        companyId: targetCompanyId,
        approvalStatus: "PENDING",
        deletedAt: null
      },
      include: {
        createdBy: true,
        wbs: {
          include: {
            project: true
          }
        }
      }
    });

    // 3. Lấy Advances chờ duyệt
    const advances = await prisma.advanceRequest.findMany({
      where: {
        companyId: targetCompanyId,
        status: "SUBMITTED",
        deletedAt: null
      },
      include: {
        requester: true,
        project: true
      }
    });

    // 4. Lấy Settlements chờ duyệt
    const settlements = await prisma.advanceSettlement.findMany({
      where: {
        companyId: targetCompanyId,
        status: "SUBMITTED",
        deletedAt: null
      },
      include: {
        creator: true,
        company: true,
        advanceRequest: {
          include: {
            project: true
          }
        }
      }
    });

    const pendingList: PendingDoc[] = [];

    // Map Invoices
    for (const inv of invoices) {
      pendingList.push({
        id: inv.id,
        module: "INVOICE",
        docNo: inv.invoiceNumber || inv.id,
        projectId: inv.projectId,
        projectName: inv.contract?.project?.name || "Dự án đầu ra",
        amount: Number(inv.amount),
        createdById: inv.createdById || "",
        creatorName: inv.createdBy?.name || "Kế toán viên",
        createdAt: inv.createdAt,
        status: inv.approvalStatus
      });
    }

    // Map Costs
    for (const cost of costs) {
      pendingList.push({
        id: cost.id,
        module: "COST",
        docNo: cost.id.split("-")[0].toUpperCase(),
        projectId: cost.projectId,
        projectName: cost.wbs?.project?.name || "Chi phí công trình",
        amount: Number(cost.amount),
        createdById: cost.createdById || "",
        creatorName: cost.createdBy?.name || "Quản lý công trình",
        createdAt: cost.createdAt,
        status: cost.approvalStatus
      });
    }

    // Map Advances
    for (const adv of advances) {
      pendingList.push({
        id: adv.id,
        module: "ADVANCE",
        docNo: adv.advanceNo || adv.id,
        projectId: adv.projectId || "",
        projectName: adv.project?.name || "Tạm ứng nhân viên",
        amount: Number(adv.amount),
        createdById: adv.requestedBy || "",
        creatorName: adv.requester?.name || "Nhân viên đề nghị",
        createdAt: adv.createdAt,
        status: adv.status
      });
    }

    // Map Settlements
    for (const set of settlements) {
      pendingList.push({
        id: set.id,
        module: "SETTLEMENT",
        docNo: set.id.split("-")[0].toUpperCase(),
        projectId: set.advanceRequest?.projectId || "",
        projectName: set.advanceRequest?.project?.name || "Quyết toán tạm ứng",
        amount: Number(set.amount),
        createdById: set.createdBy || "",
        creatorName: set.creator?.name || "Người quyết toán",
        createdAt: set.createdAt,
        status: set.status
      });
    }

    return pendingList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Lấy lịch sử phê duyệt của user
   */
  static async getApprovedHistory(user: { id: string; companyId: string | null }) {
    let targetCompanyId = user.companyId;
    if (!targetCompanyId) {
      const cmp = await prisma.company.findFirst();
      targetCompanyId = cmp?.id || null;
    }
    if (!targetCompanyId) {
      throw new ApiError(400, "User must belong to a company");
    }

    // Truy vấn lịch sử duyệt qua AuditLog
    const logs = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
        action: {
          in: ["APPROVE", "REJECT"]
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 50
    });

    return logs.map(log => ({
      id: log.id,
      entity: log.entity,
      entityId: log.entityId,
      action: log.action,
      timestamp: log.timestamp,
      reason: log.reason || ""
    }));
  }

  /**
   * Lấy toàn bộ chứng từ do user hiện tại tạo ra (phân hệ công ty)
   */
  static async getMyCreated(user: { id: string; companyId: string | null }) {
    let targetCompanyId = user.companyId;
    if (!targetCompanyId) {
      const cmp = await prisma.company.findFirst();
      targetCompanyId = cmp?.id || null;
    }
    if (!targetCompanyId) {
      throw new ApiError(400, "User must belong to a company");
    }

    // 1. Lấy Invoices
    const invoices = await prisma.invoice.findMany({
      where: { companyId: targetCompanyId, createdById: user.id, deletedAt: null },
      include: { createdBy: true, contract: { include: { project: true } } }
    });

    // 2. Lấy Costs
    const costs = await prisma.costRecord.findMany({
      where: { companyId: targetCompanyId, createdById: user.id, deletedAt: null },
      include: { createdBy: true, wbs: { include: { project: true } } }
    });

    // 3. Lấy Advances
    const advances = await prisma.advanceRequest.findMany({
      where: { companyId: targetCompanyId, requestedBy: user.id, deletedAt: null },
      include: { requester: true, project: true }
    });

    // 4. Lấy Settlements
    const settlements = await prisma.advanceSettlement.findMany({
      where: { companyId: targetCompanyId, createdBy: user.id, deletedAt: null },
      include: { creator: true, advanceRequest: { include: { project: true } } }
    });

    const list: PendingDoc[] = [];

    for (const inv of invoices) {
      list.push({
        id: inv.id,
        module: "INVOICE",
        docNo: inv.invoiceNumber || inv.id,
        projectId: inv.projectId,
        projectName: inv.contract?.project?.name || "Dự án đầu ra",
        amount: Number(inv.amount),
        createdById: inv.createdById || "",
        creatorName: inv.createdBy?.name || "Kế toán viên",
        createdAt: inv.createdAt,
        status: inv.approvalStatus
      });
    }

    for (const cost of costs) {
      list.push({
        id: cost.id,
        module: "COST",
        docNo: cost.id.split("-")[0].toUpperCase(),
        projectId: cost.projectId,
        projectName: cost.wbs?.project?.name || "Chi phí công trình",
        amount: Number(cost.amount),
        createdById: cost.createdById || "",
        creatorName: cost.createdBy?.name || "Quản lý công trình",
        createdAt: cost.createdAt,
        status: cost.approvalStatus
      });
    }

    for (const adv of advances) {
      list.push({
        id: adv.id,
        module: "ADVANCE",
        docNo: adv.advanceNo || adv.id,
        projectId: adv.projectId || "",
        projectName: adv.project?.name || "Tạm ứng nhân viên",
        amount: Number(adv.amount),
        createdById: adv.requestedBy || "",
        creatorName: adv.requester?.name || "Nhân viên đề nghị",
        createdAt: adv.createdAt,
        status: adv.status
      });
    }

    for (const set of settlements) {
      list.push({
        id: set.id,
        module: "SETTLEMENT",
        docNo: set.id.split("-")[0].toUpperCase(),
        projectId: set.advanceRequest?.projectId || "",
        projectName: set.advanceRequest?.project?.name || "Quyết toán tạm ứng",
        amount: Number(set.amount),
        createdById: set.createdBy || "",
        creatorName: set.creator?.name || "Người quyết toán",
        createdAt: set.createdAt,
        status: set.status
      });
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Lấy chi tiết một chứng từ cụ thể phục vụ xem drawer
   */
  static async getDocById(id: string, module: string, companyId: string | null) {
    if (module === "INVOICE") {
      const inv = await prisma.invoice.findFirst({
        where: { id, deletedAt: null },
        include: { createdBy: true, contract: { include: { project: true } } }
      });
      if (!inv) throw new ApiError(404, "Không tìm thấy hóa đơn");
      return {
        id: inv.id,
        module: "INVOICE",
        docNo: inv.invoiceNumber || inv.id,
        projectId: inv.projectId,
        projectName: inv.contract?.project?.name || "Dự án đầu ra",
        amount: Number(inv.amount),
        createdById: inv.createdById || "",
        creatorName: inv.createdBy?.name || "Kế toán viên",
        createdAt: inv.createdAt,
        status: inv.approvalStatus
      };
    }

    if (module === "COST") {
      const cost = await prisma.costRecord.findFirst({
        where: { id, deletedAt: null },
        include: { createdBy: true, wbs: { include: { project: true } } }
      });
      if (!cost) throw new ApiError(404, "Không tìm thấy chi phí");
      return {
        id: cost.id,
        module: "COST",
        docNo: cost.id.split("-")[0].toUpperCase(),
        projectId: cost.projectId,
        projectName: cost.wbs?.project?.name || "Chi phí công trình",
        amount: Number(cost.amount),
        createdById: cost.createdById || "",
        creatorName: cost.createdBy?.name || "Quản lý công trình",
        createdAt: cost.createdAt,
        status: cost.approvalStatus
      };
    }

    if (module === "ADVANCE") {
      const adv = await prisma.advanceRequest.findFirst({
        where: { id, deletedAt: null },
        include: { requester: true, project: true }
      });
      if (!adv) throw new ApiError(404, "Không tìm thấy tạm ứng");
      return {
        id: adv.id,
        module: "ADVANCE",
        docNo: adv.advanceNo || adv.id,
        projectId: adv.projectId || "",
        projectName: adv.project?.name || "Tạm ứng nhân viên",
        amount: Number(adv.amount),
        createdById: adv.requestedBy || "",
        creatorName: adv.requester?.name || "Nhân viên đề nghị",
        createdAt: adv.createdAt,
        status: adv.status
      };
    }

    if (module === "SETTLEMENT") {
      const set = await prisma.advanceSettlement.findFirst({
        where: { id, deletedAt: null },
        include: { creator: true, advanceRequest: { include: { project: true } } }
      });
      if (!set) throw new ApiError(404, "Không tìm thấy quyết toán");
      return {
        id: set.id,
        module: "SETTLEMENT",
        docNo: set.id.split("-")[0].toUpperCase(),
        projectId: set.advanceRequest?.projectId || "",
        projectName: set.advanceRequest?.project?.name || "Quyết toán tạm ứng",
        amount: Number(set.amount),
        createdById: set.createdBy || "",
        creatorName: set.creator?.name || "Người quyết toán",
        createdAt: set.createdAt,
        status: set.status
      };
    }

    throw new ApiError(400, "Module không được hỗ trợ");
  }

  /**
   * Phê duyệt chứng từ tập trung
   */
  static async approveDoc(id: string, module: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      if (module === "INVOICE") {
        const inv = await tx.invoice.findUnique({ where: { id } });
        if (!inv || inv.deletedAt) throw new ApiError(404, "Không tìm thấy hóa đơn");
        if (inv.createdById === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự phê duyệt chứng từ do chính mình tạo ra.");
        }
        return await RevenueService.updateInvoiceApproval(id, "APPROVED", userId);
      }

      if (module === "COST") {
        const cost = await tx.costRecord.findUnique({ where: { id } });
        if (!cost || cost.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ chi phí");
        if (cost.createdById === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự phê duyệt chứng từ do chính mình tạo ra.");
        }
        
        const updated = await tx.costRecord.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            updatedAt: new Date()
          }
        });

        await AuditService.log({
          userId,
          action: "APPROVE",
          entity: "CostRecord",
          entityId: id,
          newData: updated
        });

        await LoggerService.info(`Approved CostRecord ${id} by user ${userId}`);

        return updated;
      }

      if (module === "ADVANCE") {
        const adv = await tx.advanceRequest.findUnique({ where: { id } });
        if (!adv || adv.deletedAt) throw new ApiError(404, "Không tìm thấy đề nghị tạm ứng");
        if (adv.requestedBy === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự phê duyệt chứng từ do chính mình tạo ra.");
        }
        const updated = await tx.advanceRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedBy: userId,
            approvedAt: new Date()
          }
        });
        await AuditService.log({
          userId,
          action: "APPROVE",
          entity: "AdvanceRequest",
          entityId: id,
          newData: updated
        });
        await LoggerService.info(`Approved AdvanceRequest ${id} by user ${userId}`);
        return updated;
      }

      if (module === "SETTLEMENT") {
        const set = await tx.advanceSettlement.findUnique({ where: { id } });
        if (!set || set.deletedAt) throw new ApiError(404, "Không tìm thấy quyết toán");
        if (set.createdBy === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự phê duyệt chứng từ do chính mình tạo ra.");
        }
        const updated = await tx.advanceSettlement.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedBy: userId,
            approvedAt: new Date()
          }
        });
        await AuditService.log({
          userId,
          action: "APPROVE",
          entity: "AdvanceSettlement",
          entityId: id,
          newData: updated
        });
        await LoggerService.info(`Approved AdvanceSettlement ${id} by user ${userId}`);
        return updated;
      }

      throw new ApiError(400, "Module không được hỗ trợ duyệt tập trung");
    });
  }

  /**
   * Từ chối chứng từ tập trung
   */
  static async rejectDoc(id: string, module: string, userId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Bắt buộc phải nhập lý do từ chối tối thiểu 5 ký tự.");
    }

    return prisma.$transaction(async (tx) => {
      if (module === "INVOICE") {
        const inv = await tx.invoice.findUnique({ where: { id } });
        if (!inv || inv.deletedAt) throw new ApiError(404, "Không tìm thấy hóa đơn");
        if (inv.createdById === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự từ chối/phê duyệt chứng từ của chính mình.");
        }
        return await RevenueService.updateInvoiceApproval(id, "REJECTED", userId);
      }

      if (module === "COST") {
        const cost = await tx.costRecord.findUnique({ where: { id } });
        if (!cost || cost.deletedAt) throw new ApiError(404, "Không tìm thấy chi phí");
        if (cost.createdById === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự từ chối/phê duyệt chứng từ của chính mình.");
        }

        const updated = await tx.costRecord.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            updatedAt: new Date()
          }
        });

        await AuditService.log({
          userId,
          action: "REJECT",
          entity: "CostRecord",
          entityId: id,
          newData: updated,
          reason
        });

        await LoggerService.info(`Rejected CostRecord ${id} by user ${userId} for reason: ${reason}`);

        return updated;
      }

      if (module === "ADVANCE") {
        const adv = await tx.advanceRequest.findUnique({ where: { id } });
        if (!adv || adv.deletedAt) throw new ApiError(404, "Không tìm thấy đề nghị tạm ứng");
        if (adv.requestedBy === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự từ chối/phê duyệt chứng từ của chính mình.");
        }
        const updated = await tx.advanceRequest.update({
          where: { id },
          data: {
            status: "DRAFT"
          }
        });
        await AuditService.log({
          userId,
          action: "REJECT",
          entity: "AdvanceRequest",
          entityId: id,
          newData: updated,
          reason
        });
        await LoggerService.info(`Rejected AdvanceRequest ${id} by user ${userId} for reason: ${reason}`);
        return updated;
      }

      if (module === "SETTLEMENT") {
        const set = await tx.advanceSettlement.findUnique({ where: { id } });
        if (!set || set.deletedAt) throw new ApiError(404, "Không tìm thấy quyết toán");
        if (set.createdBy === userId) {
          throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Bạn không thể tự từ chối/phê duyệt chứng từ của chính mình.");
        }
        const updated = await tx.advanceSettlement.update({
          where: { id },
          data: {
            status: "DRAFT"
          }
        });
        await AuditService.log({
          userId,
          action: "REJECT",
          entity: "AdvanceSettlement",
          entityId: id,
          newData: updated,
          reason
        });
        await LoggerService.info(`Rejected AdvanceSettlement ${id} by user ${userId} for reason: ${reason}`);
        return updated;
      }

      throw new ApiError(400, "Module không được hỗ trợ");
    });
  }
}
