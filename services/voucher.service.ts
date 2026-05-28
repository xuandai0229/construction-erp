import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { safeDecimal } from "@/lib/math";
import { AuditService } from "./audit.service";
import { TransactionType } from "@prisma/client";
import { assertPeriodNotLocked } from "@/lib/period";
import { VoucherNumberService } from "./finance/voucher-number.service";
import { DocumentGovernance } from "@/lib/governance/document-governance";
import { VoucherState, VoucherWorkflowGovernance } from "@/lib/governance/voucher-workflow";
import { RBAC } from "@/lib/rbac";

export interface VoucherLineInput {
  accountId: string;
  amount: number | string;
  type: "DEBIT" | "CREDIT";
  description?: string;
}

export interface VoucherInput {
  projectId?: string | null;
  date?: string | Date;
  description: string;
  reference?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  status?: VoucherState | "DA_CAT";
  lines: VoucherLineInput[];
}

export interface GovernanceContext {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  reason?: string;
}

export class VoucherService {
  private static async getVoucherCreatorId(tx: any, voucherId: string) {
    const log = await tx.auditLog.findFirst({
      where: { entity: "JournalEntry", entityId: voucherId, action: "CREATE" },
      orderBy: { timestamp: "asc" },
      select: { userId: true }
    });
    return log?.userId || null;
  }

  private static async getVoucherApproverId(tx: any, voucherId: string) {
    const log = await tx.auditLog.findFirst({
      where: { entity: "JournalEntry", entityId: voucherId, action: "APPROVE" },
      orderBy: { timestamp: "desc" },
      select: { userId: true }
    });
    return log?.userId || null;
  }

  static async submitVoucher(userId: string, voucherId: string, context: GovernanceContext = {}) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });
      if (!voucher) throw new ApiError(404, "Khong tim thay chung tu.");
      VoucherWorkflowGovernance.assertTransition(voucher.status, "CHO_DUYET");

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: { status: "CHO_DUYET", isPosted: false, updatedAt: new Date() },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: context.reason || "Trinh duyet chung tu ke toan",
        severity: "INFO",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });
      return updated;
    });
  }

  static async approveVoucher(userId: string, voucherId: string, context: GovernanceContext = {}) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user) throw new ApiError(401, "Nguoi dung khong hop le.");
      RBAC.assertPermission(user.role, "VOUCHER", "APPROVE");

      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });
      if (!voucher) throw new ApiError(404, "Khong tim thay chung tu.");
      VoucherWorkflowGovernance.assertTransition(voucher.status, "DA_DUYET");
      const creatorId = await this.getVoucherCreatorId(tx, voucherId);
      RBAC.assertSegregationOfDuties(creatorId, userId);

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: { status: "DA_DUYET", isPosted: false, updatedAt: new Date() },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "POST",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: context.reason || "Duyet chung tu ke toan",
        severity: "INFO",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });
      return updated;
    });
  }

  static async rejectVoucher(userId: string, voucherId: string, context: GovernanceContext = {}) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });
      if (!voucher) throw new ApiError(404, "Khong tim thay chung tu.");
      VoucherWorkflowGovernance.assertTransition(voucher.status, "TU_CHOI");

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: { status: "TU_CHOI", isPosted: false, updatedAt: new Date() },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "REJECT",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: context.reason || "Tu choi duyet chung tu",
        severity: "WARNING",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });
      return updated;
    });
  }

  /**
   * Lưu chứng từ (Trạng thái NHAP hoặc DA_CAT)
   * Cho phép tạo mới hoặc cập nhật chứng từ chưa ghi sổ.
   */
  static async saveVoucher(userId: string, data: VoucherInput & { id?: string }) {
    return prisma.$transaction(async (tx) => {
      let oldVoucher: any = null;

      // Lấy companyId đại diện cho người dùng để kiểm soát multi-tenant và khóa kỳ
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      if (!user || !user.companyId) {
        throw new ApiError(400, "Người dùng không thuộc doanh nghiệp hợp lệ.");
      }
      const companyId = user.companyId;

      if (data.id) {
        // Kiểm tra chứng từ cũ có tồn tại
        oldVoucher = await tx.journalEntry.findUnique({
          where: { id: data.id, deletedAt: null },
          include: { lines: true }
        });
        
        if (!oldVoucher) {
          throw new ApiError(404, "Không tìm thấy chứng từ cần cập nhật.");
        }
        
        // Nếu đã ghi sổ thì KHÔNG được sửa đổi trực tiếp
        if (oldVoucher.status === "DA_GHI_SO") {
          throw new ApiError(400, "Chứng từ đã ghi sổ (Ghi sổ). Vui lòng 'Bỏ ghi' trước khi sửa.");
        }

        // Khóa sổ kỳ kế toán: chặn sửa chứng từ thuộc kỳ cũ đã đóng
        await assertPeriodNotLocked(oldVoucher.date, companyId);
      }

      // 1. Kiểm tra nguyên tắc hạch toán kép (Tổng Nợ = Tổng Có)
      let sumDebit = safeDecimal(0);
      let sumCredit = safeDecimal(0);
      
      for (const line of data.lines) {
        const lineAmt = safeDecimal(line.amount);
        if (lineAmt.lte(0)) {
          throw new ApiError(400, "Số tiền hạch toán phải lớn hơn 0.");
        }
        if (line.type === "DEBIT") {
          sumDebit = sumDebit.add(lineAmt);
        } else {
          sumCredit = sumCredit.add(lineAmt);
        }
      }
      
      if (!sumDebit.equals(sumCredit)) {
        throw new ApiError(
          400,
          `Hạch toán không cân đối. Tổng Nợ (${sumDebit.toString()}) phải bằng Tổng Có (${sumCredit.toString()})`
        );
      }

      // 2. Kiểm tra tính hợp lệ của tài khoản
      const accountIds = data.lines.map(l => l.accountId);
      const accounts = await tx.ledgerAccount.findMany({
        where: { id: { in: accountIds }, isActive: true, deletedAt: null }
      });
      if (accounts.length !== Array.from(new Set(accountIds)).length) {
        throw new ApiError(400, "Một hoặc nhiều tài khoản hạch toán không tồn tại hoặc đã ngừng hoạt động.");
      }

      const status = data.status ? VoucherWorkflowGovernance.normalize(data.status) : "NHAP";
      const isPosted = status === "DA_GHI_SO";
      const voucherDate = data.date ? new Date(data.date) : new Date();

      // Khóa sổ kỳ kế toán: chặn ghi nhận chứng từ mới/ngày mới vào kỳ đã đóng
      await assertPeriodNotLocked(voucherDate, companyId);

      // Tự động sinh số chứng từ tăng dần (Atomic FOR UPDATE) nếu trống
      let reference = data.reference;
      if (!reference) {
        const allowedTypes = ["PT", "PC", "UNC", "BC", "BN", "PN", "PX", "PKT"];
        const vType = (data.sourceType && allowedTypes.includes(data.sourceType.toUpperCase()))
          ? data.sourceType.toUpperCase()
          : "PKT";
        reference = await VoucherNumberService.generateNextNumber(tx, companyId, vType, voucherDate);
      }

      let voucher: any;
      if (data.id) {
        // Xóa các dòng hạch toán cũ
        await tx.transactionLine.deleteMany({
          where: { journalEntryId: data.id }
        });

        // Cập nhật chứng từ
        voucher = await tx.journalEntry.update({
          where: { id: data.id },
          data: {
            projectId: data.projectId || null,
            date: voucherDate,
            description: data.description,
            reference,
            sourceType: data.sourceType || null,
            sourceId: data.sourceId || null,
            status,
            isPosted,
            updatedAt: new Date()
          },
          include: { lines: true }
        });
      } else {
        // Tạo mới chứng từ
        voucher = await tx.journalEntry.create({
          data: {
            projectId: data.projectId || null,
            date: voucherDate,
            description: data.description,
            reference,
            sourceType: data.sourceType || null,
            sourceId: data.sourceId || null,
            status,
            isPosted,
          }
        });
      }

      // Tạo các dòng hạch toán mới
      const linesData = data.lines.map(line => ({
        journalEntryId: voucher.id,
        accountId: line.accountId,
        amount: safeDecimal(line.amount),
        type: line.type as TransactionType,
        description: line.description || data.description
      }));

      // Tạo từng dòng hạch toán
      for (const line of linesData) {
        await tx.transactionLine.create({
          data: line
        });
      }

      const updatedVoucher = await tx.journalEntry.findUnique({
        where: { id: voucher.id },
        include: { lines: { include: { account: true } } }
      });

      // 3. Ghi Audit Log lưu vết
      await AuditService.log({
        userId,
        action: data.id ? "UPDATE" : "CREATE",
        entity: "JournalEntry",
        entityId: voucher.id,
        oldData: oldVoucher,
        newData: updatedVoucher,
        reason: data.id ? "Cập nhật chứng từ kế toán" : "Lập mới chứng từ kế toán",
        severity: "INFO"
      });

      return updatedVoucher;
    });
  }

  /**
   * Ghi sổ chứng từ (postVoucher)
   * Đóng băng số liệu hạch toán, tính toán vào sổ cái.
   */
  static async postVoucher(userId: string, voucherId: string, context: GovernanceContext = {}) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });

      if (!voucher) {
        throw new ApiError(404, "Không tìm thấy chứng từ.");
      }

      if (voucher.status === "DA_GHI_SO") {
        throw new ApiError(400, "Chứng từ đã được ghi sổ trước đó.");
      }
      
      if (voucher.status === "DA_HUY") {
        throw new ApiError(400, "Chứng từ đã bị hủy, không thể ghi sổ.");
      }

      VoucherWorkflowGovernance.assertPostable(voucher.status);
      const creatorId = await this.getVoucherCreatorId(tx, voucherId);
      const approverId = await this.getVoucherApproverId(tx, voucherId);
      if (!approverId) {
        throw new ApiError(400, "Chung tu chua co audit duyet hop le, khong duoc ghi so.");
      }
      RBAC.assertSegregationOfDuties(creatorId, approverId);

      // Lấy thông tin công ty để kiểm tra khóa kỳ
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      const companyId = user?.companyId;

      // Khóa sổ kỳ kế toán check
      await assertPeriodNotLocked(voucher.date, companyId ?? undefined);

      const documentOr: any[] = [{ sourceType: "JournalEntry", sourceId: voucher.id }];
      if (voucher.sourceType && voucher.sourceId) {
        documentOr.push({ sourceType: voucher.sourceType, sourceId: voucher.sourceId });
      }
      if (voucher.projectId && voucher.sourceType) {
        documentOr.push({ projectId: voucher.projectId, sourceType: voucher.sourceType });
      }
      const documents = await tx.document.findMany({
        where: { deletedAt: null, OR: documentOr },
        select: { type: true, deletedAt: true }
      });
      DocumentGovernance.assertComplete(
        { sourceType: voucher.sourceType, sourceId: voucher.sourceId, projectId: voucher.projectId },
        documents
      );

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: {
          status: "DA_GHI_SO",
          isPosted: true,
          updatedAt: new Date()
        },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "POST",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: context.reason || "Ghi so chung tu ke toan",
        severity: "INFO",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId
      });

      return updated;
    });
  }

  /**
   * Bỏ ghi sổ chứng từ (unpostVoucher)
   * Chuyển trạng thái chứng từ về DA_CAT để có thể chỉnh sửa/xóa.
   */
  static async unpostVoucher(userId: string, voucherId: string, context: GovernanceContext = {}) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });

      if (!voucher) {
        throw new ApiError(404, "Không tìm thấy chứng từ.");
      }

      if (voucher.status !== "DA_GHI_SO") {
        throw new ApiError(400, "Chứng từ chưa được ghi sổ.");
      }

      // Lấy thông tin công ty để kiểm tra khóa kỳ
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      const companyId = user?.companyId;

      // Khóa sổ kỳ kế toán check
      await assertPeriodNotLocked(voucher.date, companyId ?? undefined);

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: {
          status: "DA_DUYET",
          isPosted: false,
          updatedAt: new Date()
        },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "REVERSE",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: context.reason || "Bo ghi so chung tu ke toan",
        severity: "INFO",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId
      });

      return updated;
    });
  }

  /**
   * Hủy chứng từ (cancelVoucher)
   * Hủy chứng từ và không tính vào số dư sổ cái.
   */
  static async cancelVoucher(userId: string, voucherId: string) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null },
        include: { lines: true }
      });

      if (!voucher) {
        throw new ApiError(404, "Không tìm thấy chứng từ.");
      }

      if (voucher.status === "DA_GHI_SO") {
        throw new ApiError(400, "Chứng từ đang ghi sổ, phải 'Bỏ ghi' trước khi hủy.");
      }

      // Lấy thông tin công ty để kiểm tra khóa kỳ
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      const companyId = user?.companyId;

      // Khóa sổ kỳ kế toán check
      await assertPeriodNotLocked(voucher.date, companyId ?? undefined);

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: {
          status: "DA_HUY",
          isPosted: false,
          updatedAt: new Date()
        },
        include: { lines: { include: { account: true } } }
      });

      await AuditService.log({
        userId,
        action: "REJECT",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: "Hủy chứng từ kế toán",
        severity: "WARNING"
      });

      return updated;
    });
  }

  /**
   * Xóa chứng từ (Chỉ cho phép xóa khi ở trạng thái NHAP, DA_CAT hoặc DA_HUY)
   */
  static async deleteVoucher(userId: string, voucherId: string) {
    return prisma.$transaction(async (tx) => {
      const voucher = await tx.journalEntry.findUnique({
        where: { id: voucherId, deletedAt: null }
      });

      if (!voucher) {
        throw new ApiError(404, "Không tìm thấy chứng từ.");
      }

      if (voucher.status === "DA_GHI_SO") {
        throw new ApiError(400, "Chứng từ đã ghi sổ, không được phép xóa. Vui lòng 'Bỏ ghi' trước.");
      }

      // Lấy thông tin công ty để kiểm tra khóa kỳ
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      const companyId = user?.companyId;

      // Khóa sổ kỳ kế toán check
      await assertPeriodNotLocked(voucher.date, companyId ?? undefined);

      const updated = await tx.journalEntry.update({
        where: { id: voucherId },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "JournalEntry",
        entityId: voucherId,
        oldData: voucher,
        newData: updated,
        reason: "Xóa chứng từ kế toán",
        severity: "WARNING"
      });

      return { success: true };
    });
  }

  /**
   * Lấy danh sách chứng từ
   */
  static async getVouchers(filters?: {
    projectId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const where: any = { deletedAt: null };
    
    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }
    
    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } }
      ];
    }
    
    const count = await prisma.journalEntry.count({ where });
    const vouchers = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: { include: { account: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" },
      take: filters?.limit || 50,
      skip: filters?.skip || 0
    });
    
    return {
      vouchers,
      totalCount: count
    };
  }

  /**
   * Chi tiết chứng từ
   */
  static async getVoucherDetail(voucherId: string) {
    const voucher = await prisma.journalEntry.findFirst({
      where: { id: voucherId, deletedAt: null },
      include: {
        lines: { include: { account: true } },
        project: { select: { id: true, name: true } }
      }
    });
    if (!voucher) throw new ApiError(404, "Không tìm thấy chứng từ.");
    return voucher;
  }
}
