import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { assertPeriodNotLocked } from "@/lib/period";
import { AuditService } from "./audit.service";
import { LoggerService } from "./logger.service";
import { CashBankDocumentType, CashBankDocumentStatus } from "../generated/prisma-client";

export class CashBankService {
  
  static async createDocument(
    input: {
      companyId?: string;
      projectId?: string;
      contractId?: string;
      documentType: CashBankDocumentType;
      documentNo?: string;
      documentDate?: Date;
      accountingDate?: Date;
      amount: number;
      currency?: string;
      description: string;
      partnerName?: string;
      paymentMethod: "CASH" | "BANK";
      debitAccountId: string;
      creditAccountId: string;
    },
    userId: string
  ) {
    if (input.amount <= 0) {
      throw new ApiError(400, "LỖI HẠCH TOÁN: Số tiền phải lớn hơn 0");
    }
    if (!input.description || input.description.trim().length < 5) {
      throw new ApiError(400, "LỖI LẬP PHIẾU: Lý do/nội dung phải có ít nhất 5 ký tự");
    }
    if (!input.debitAccountId || !input.creditAccountId) {
      throw new ApiError(400, "LỖI ĐỊNH KHOẢN: Tài khoản Nợ và tài khoản Có không được để trống");
    }

    const docDate = input.documentDate ? new Date(input.documentDate) : new Date();
    const accDate = input.accountingDate ? new Date(input.accountingDate) : new Date();

    await assertPeriodNotLocked(accDate);

    return prisma.$transaction(async (tx) => {
      let finalCompanyId = input.companyId;
      if (!finalCompanyId) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (user?.companyId) {
          finalCompanyId = user.companyId;
        } else {
          const cmp = await tx.company.findFirst();
          finalCompanyId = cmp?.id || undefined;
        }
      }

      if (!finalCompanyId) {
        throw new ApiError(400, "LỖI HỆ THỐNG: Người dùng không thuộc công ty/tenant nào");
      }

      // Automatically generate documentNo if not provided
      let finalDocumentNo = input.documentNo;
      if (!finalDocumentNo) {
        const yearMonth = accDate.toISOString().slice(0, 7).replace("-", "");
        let prefix = "PT";
        if (input.documentType === "CASH_RECEIPT") prefix = "PT";
        else if (input.documentType === "CASH_PAYMENT") prefix = "PC";
        else if (input.documentType === "BANK_TRANSFER") prefix = "UNC";
        else if (input.documentType === "BANK_CREDIT_NOTICE") prefix = "GBC";
        else if (input.documentType === "BANK_DEBIT_NOTICE") prefix = "GBN";

        const startsWithPattern = `${prefix}-${yearMonth}-`;
        const count = await tx.cashBankDocument.count({
          where: {
            companyId: finalCompanyId,
            documentType: input.documentType,
            documentNo: { startsWith: startsWithPattern },
            deletedAt: null,
          },
        });
        finalDocumentNo = `${startsWithPattern}${String(count + 1).padStart(4, "0")}`;
      }

      // Verify unique document number
      const existing = await tx.cashBankDocument.findFirst({
        where: {
          companyId: finalCompanyId,
          documentType: input.documentType,
          documentNo: finalDocumentNo,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ApiError(400, `Số chứng từ ${finalDocumentNo} đã tồn tại trong hệ thống.`);
      }

      const doc = await tx.cashBankDocument.create({
        data: {
          companyId: finalCompanyId,
          projectId: input.projectId || null,
          contractId: input.contractId || null,
          documentType: input.documentType,
          documentNo: finalDocumentNo,
          documentDate: docDate,
          accountingDate: accDate,
          amount: input.amount,
          currency: input.currency || "VND",
          description: input.description,
          partnerName: input.partnerName || null,
          paymentMethod: input.paymentMethod,
          debitAccountId: input.debitAccountId,
          creditAccountId: input.creditAccountId,
          status: "DRAFT",
          createdBy: userId,
        },
        include: {
          debitAccount: true,
          creditAccount: true,
        },
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "CashBankDocument",
        entityId: doc.id,
        newData: doc,
      });

      await LoggerService.info(`Created CashBankDocument ${doc.documentNo} (${doc.documentType}) by user ${userId}`);
      return doc;
    });
  }

  static async submitDocument(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status !== "DRAFT") {
        throw new ApiError(400, "Chỉ chứng từ ở trạng thái Nháp (DRAFT) mới có thể trình duyệt.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: { status: "SUBMITTED" },
        include: { debitAccount: true, creditAccount: true },
      });

      await AuditService.log({
        userId,
        action: "SUBMIT",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
      });

      await LoggerService.info(`Submitted CashBankDocument ${doc.documentNo} by user ${userId}`);
      return updated;
    });
  }

  static async approveDocument(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status !== "SUBMITTED") {
        throw new ApiError(400, "Chỉ chứng từ ở trạng thái Trình duyệt (SUBMITTED) mới có thể phê duyệt.");
      }

      // Segregation of Duties (SoD) check
      if (doc.createdBy === userId) {
        throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Người tạo chứng từ không được tự duyệt chứng từ của chính mình.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
        },
        include: { debitAccount: true, creditAccount: true },
      });

      await AuditService.log({
        userId,
        action: "APPROVE",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
      });

      await LoggerService.info(`Approved CashBankDocument ${doc.documentNo} by approver ${userId}`);
      return updated;
    });
  }

  static async rejectDocument(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Lý do từ chối phải có ít nhất 5 ký tự.");
    }

    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status !== "SUBMITTED") {
        throw new ApiError(400, "Chỉ chứng từ ở trạng thái Trình duyệt (SUBMITTED) mới có thể từ chối.");
      }

      // Segregation of Duties (SoD) check
      if (doc.createdBy === userId) {
        throw new ApiError(400, "Nguyên tắc bất kiêm nhiệm: Người tạo chứng từ không được tự từ chối chứng từ của chính mình.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: { status: "DRAFT" },
        include: { debitAccount: true, creditAccount: true },
      });

      await AuditService.log({
        userId,
        action: "REJECT",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
        reason,
      });

      await LoggerService.info(`Rejected CashBankDocument ${doc.documentNo} by user ${userId} for reason: ${reason}`);
      return updated;
    });
  }

  static async postDocument(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
        include: { debitAccount: true, creditAccount: true },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status !== "APPROVED") {
        throw new ApiError(400, "Chỉ chứng từ ở trạng thái Đã Duyệt (APPROVED) mới được phép ghi sổ cái.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      // Create Double-Entry Ledger hạch toán
      const lines = [
        { accountCode: doc.debitAccount.code, amount: Number(doc.amount), type: "DEBIT" as const },
        { accountCode: doc.creditAccount.code, amount: Number(doc.amount), type: "CREDIT" as const },
      ];

      // Perform Double-Entry Posting
      await PostingEngine.createDoubleEntry(tx, {
        projectId: doc.projectId,
        description: `${doc.documentType === "CASH_RECEIPT" ? "Thu tiền" : doc.documentType === "CASH_PAYMENT" ? "Chi tiền" : "Chuyển khoản"}: ${doc.description}`,
        reference: doc.documentNo,
        sourceType: "CASH_BANK",
        sourceId: doc.id,
        lines,
      });

      // Find the created Journal Entry
      const entry = await tx.journalEntry.findFirst({
        where: { sourceId: doc.id, sourceType: "CASH_BANK", deletedAt: null },
      });

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: {
          status: "POSTED",
          postedJournalEntryId: entry?.id || null,
        },
        include: { debitAccount: true, creditAccount: true },
      });

      // Post-Integration hooks: If this CashBankDocument relates to an Advance Request being paid, update the advance status!
      if (doc.documentType === "CASH_PAYMENT" || doc.documentType === "BANK_TRANSFER") {
        // Find if there is an outstanding advance request for the project/supplier/employee that matches
        // For simplicity and automation, we can check source link or advance request payment matching
      }

      await AuditService.log({
        userId,
        action: "POST",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
      });

      await LoggerService.info(`Posted CashBankDocument ${doc.documentNo} to ledger (JournalEntry ID: ${entry?.id})`);
      return updated;
    });
  }

  static async reverseDocument(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Lý do hủy ghi sổ/bút toán đảo phải có ít nhất 5 ký tự.");
    }

    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
        include: { debitAccount: true, creditAccount: true },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status !== "POSTED") {
        throw new ApiError(400, "Chỉ chứng từ Đã Ghi Sổ (POSTED) mới có thể tạo bút toán đảo.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      // Create Reversal Journal Entry
      await PostingEngine.reverseJournal(tx, doc.id, "CASH_BANK", userId);

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: {
          status: "REVERSED",
          isReversed: true,
          reversalRef: reason,
        },
        include: { debitAccount: true, creditAccount: true },
      });

      await AuditService.log({
        userId,
        action: "REVERSE",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
        reason,
      });

      await LoggerService.info(`Reversed CashBankDocument ${doc.documentNo} by user ${userId} for reason: ${reason}`);
      return updated;
    });
  }

  static async cancelDocument(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "Lý do hủy chứng từ phải có ít nhất 5 ký tự.");
    }

    return prisma.$transaction(async (tx) => {
      const doc = await tx.cashBankDocument.findUnique({
        where: { id },
      });
      if (!doc || doc.deletedAt) throw new ApiError(404, "Không tìm thấy chứng từ");
      if (doc.status === "POSTED" || doc.status === "REVERSED") {
        throw new ApiError(400, "Chứng từ đã ghi sổ cái không thể hủy trực tiếp. Vui lòng thực hiện Hủy ghi sổ/Đảo bút toán.");
      }

      await assertPeriodNotLocked(doc.accountingDate);

      const updated = await tx.cashBankDocument.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { debitAccount: true, creditAccount: true },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "CashBankDocument",
        entityId: id,
        newData: updated,
        reason,
      });

      await LoggerService.info(`Cancelled CashBankDocument ${doc.documentNo} by user ${userId}`);
      return updated;
    });
  }

  static async getDocument(id: string, user: { id: string; companyId: string | null }) {
    const doc = await prisma.cashBankDocument.findUnique({
      where: { id },
      include: {
        company: true,
        project: true,
        contract: true,
        debitAccount: true,
        creditAccount: true,
      },
    });

    if (!doc || doc.deletedAt) {
      throw new ApiError(404, "Không tìm thấy chứng từ");
    }

    // Tenant Isolation
    if (user.companyId && doc.companyId !== user.companyId) {
      throw new ApiError(403, "LỖI BẢO MẬT: Bạn không có quyền truy cập chứng từ của công ty khác.");
    }

    return doc;
  }

  static async listDocuments(
    filters: {
      companyId?: string;
      projectId?: string;
      documentType?: CashBankDocumentType;
      status?: CashBankDocumentStatus;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
    user: { id: string; companyId: string | null }
  ) {
    const where: any = { deletedAt: null };

    // Tenant Isolation
    if (user.companyId) {
      where.companyId = user.companyId;
    } else if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.documentType) where.documentType = filters.documentType;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.accountingDate = {};
      if (filters.startDate) where.accountingDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.accountingDate.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        { documentNo: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { partnerName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.cashBankDocument.findMany({
      where,
      include: {
        company: true,
        project: true,
        contract: true,
        debitAccount: true,
        creditAccount: true,
      },
      orderBy: { accountingDate: "desc" },
    });
  }

  static async getCashBook(
    filters: {
      companyId?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    },
    user: { id: string; companyId: string | null }
  ) {
    const where: any = {
      deletedAt: null,
      status: "POSTED",
      paymentMethod: "CASH",
    };

    if (user.companyId) {
      where.companyId = user.companyId;
    } else if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.projectId) where.projectId = filters.projectId;

    if (filters.startDate || filters.endDate) {
      where.accountingDate = {};
      if (filters.startDate) where.accountingDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.accountingDate.lte = new Date(filters.endDate);
    }

    const docs = await prisma.cashBankDocument.findMany({
      where,
      include: {
        debitAccount: true,
        creditAccount: true,
        project: true,
      },
      orderBy: { accountingDate: "asc" },
    });

    // Compute cumulative cash balance
    let balance = 0;
    const lines = docs.map((doc) => {
      const isReceipt = doc.documentType === "CASH_RECEIPT";
      const debitAmount = isReceipt ? Number(doc.amount) : 0;
      const creditAmount = !isReceipt ? Number(doc.amount) : 0;
      balance += debitAmount - creditAmount;

      return {
        id: doc.id,
        documentDate: doc.documentDate,
        accountingDate: doc.accountingDate,
        documentNo: doc.documentNo,
        description: doc.description,
        partnerName: doc.partnerName || "N/A",
        debitAccountCode: doc.debitAccount.code,
        creditAccountCode: doc.creditAccount.code,
        debitAmount,
        creditAmount,
        balance,
        projectName: doc.project?.name || "",
      };
    });

    return {
      totalReceipts: lines.reduce((s, l) => s + l.debitAmount, 0),
      totalPayments: lines.reduce((s, l) => s + l.creditAmount, 0),
      endingBalance: balance,
      lines,
    };
  }

  static async getBankBook(
    filters: {
      companyId?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    },
    user: { id: string; companyId: string | null }
  ) {
    const where: any = {
      deletedAt: null,
      status: "POSTED",
      paymentMethod: "BANK",
    };

    if (user.companyId) {
      where.companyId = user.companyId;
    } else if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.projectId) where.projectId = filters.projectId;

    if (filters.startDate || filters.endDate) {
      where.accountingDate = {};
      if (filters.startDate) where.accountingDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.accountingDate.lte = new Date(filters.endDate);
    }

    const docs = await prisma.cashBankDocument.findMany({
      where,
      include: {
        debitAccount: true,
        creditAccount: true,
        project: true,
      },
      orderBy: { accountingDate: "asc" },
    });

    // Compute bank book balances
    let balance = 0;
    const lines = docs.map((doc) => {
      const isCreditNotice = doc.documentType === "BANK_CREDIT_NOTICE";
      const debitAmount = isCreditNotice ? Number(doc.amount) : 0;
      const creditAmount = !isCreditNotice ? Number(doc.amount) : 0;
      balance += debitAmount - creditAmount;

      return {
        id: doc.id,
        documentDate: doc.documentDate,
        accountingDate: doc.accountingDate,
        documentNo: doc.documentNo,
        description: doc.description,
        partnerName: doc.partnerName || "N/A",
        debitAccountCode: doc.debitAccount.code,
        creditAccountCode: doc.creditAccount.code,
        debitAmount,
        creditAmount,
        balance,
        projectName: doc.project?.name || "",
      };
    });

    return {
      totalReceipts: lines.reduce((s, l) => s + l.debitAmount, 0),
      totalPayments: lines.reduce((s, l) => s + l.creditAmount, 0),
      endingBalance: balance,
      lines,
    };
  }
}
