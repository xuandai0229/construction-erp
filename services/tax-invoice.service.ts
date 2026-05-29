import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { TaxPolicy } from "@/lib/accounting/taxPolicy";
import { assertPeriodNotLocked } from "@/lib/period";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { LoggerService } from "./logger.service";
import { TaxInvoiceType, TaxInvoiceStatus, TransactionType } from "@/generated/prisma-client";

export class TaxInvoiceService {
  /**
   * Fetch all tax invoices with multi-tenant isolation, project scope, and filters.
   */
  static async getInvoices(params: {
    companyId: string;
    projectId?: string;
    invoiceType?: TaxInvoiceType;
    status?: TaxInvoiceStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const whereClause: any = {
      companyId: params.companyId,
      deletedAt: null,
    };

    if (params.projectId && params.projectId !== "ALL") {
      whereClause.projectId = params.projectId;
    }
    if (params.invoiceType && params.invoiceType !== "ALL" as any) {
      whereClause.invoiceType = params.invoiceType;
    }
    if (params.status && params.status !== "ALL" as any) {
      whereClause.status = params.status;
    }

    if (params.search) {
      const s = params.search.trim();
      whereClause.OR = [
        { invoiceNumber: { contains: s, mode: "insensitive" } },
        { invoiceSeries: { contains: s, mode: "insensitive" } },
        { partnerName: { contains: s, mode: "insensitive" } },
        { partnerTaxCode: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    if (params.startDate || params.endDate) {
      whereClause.invoiceDate = {};
      if (params.startDate) {
        whereClause.invoiceDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.invoiceDate.lte = end;
      }
    }

    return prisma.taxInvoice.findMany({
      where: whereClause,
      orderBy: { invoiceDate: "desc" },
      include: {
        project: { select: { name: true } },
        contract: { select: { contractNumber: true, title: true } },
      },
    });
  }

  /**
   * Fetch a single tax invoice by ID with strict tenant isolation.
   */
  static async getInvoiceById(id: string, companyId: string) {
    const invoice = await prisma.taxInvoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: { select: { name: true } },
        contract: { select: { contractNumber: true, title: true } },
      },
    });
    if (!invoice) {
      throw new ApiError(404, "Không tìm thấy hóa đơn VAT.");
    }
    return invoice;
  }

  /**
   * Create a new Tax Invoice (DRAFT state).
   */
  static async createInvoice(
    input: {
      companyId: string;
      projectId?: string;
      contractId?: string;
      wbsId?: string;
      invoiceType: TaxInvoiceType;
      invoiceNumber: string;
      invoiceSeries: string;
      invoiceTemplate?: string;
      invoiceDate?: Date;
      partnerName: string;
      partnerTaxCode: string;
      partnerAddress?: string;
      netAmount: number;
      vatRate: number;
      vatAmount: number;
      description?: string;
      sourceType?: string;
      sourceId?: string;
      overrideReason?: string;
    },
    userId: string
  ) {
    if (input.netAmount <= 0) {
      throw new ApiError(400, "LỖI HÓA ĐƠN: Giá trị tiền trước thuế phải lớn hơn 0.");
    }

    const invDate = input.invoiceDate ? new Date(input.invoiceDate) : new Date();
    await assertPeriodNotLocked(invDate, input.companyId);

    // Validate Tax Math
    TaxPolicy.validateTaxMath(input.netAmount, input.vatRate, input.vatAmount, input.overrideReason);

    // Validate Unique Invoice Number + Series per company
    await TaxPolicy.assertUniqueInvoice(
      input.companyId,
      input.invoiceType,
      input.invoiceNumber,
      input.invoiceSeries
    );

    const grossAmount = input.netAmount + input.vatAmount;

    return prisma.$transaction(async (tx) => {
      const taxInvoice = await tx.taxInvoice.create({
        data: {
          companyId: input.companyId,
          projectId: input.projectId || null,
          contractId: input.contractId || null,
          wbsId: input.wbsId || null,
          invoiceType: input.invoiceType,
          invoiceNumber: input.invoiceNumber.trim(),
          invoiceSeries: input.invoiceSeries.trim().toUpperCase(),
          invoiceTemplate: input.invoiceTemplate?.trim() || "1C26TBB",
          invoiceDate: invDate,
          partnerName: input.partnerName.trim(),
          partnerTaxCode: input.partnerTaxCode.trim(),
          partnerAddress: input.partnerAddress?.trim() || null,
          netAmount: input.netAmount,
          vatRate: input.vatRate,
          vatAmount: input.vatAmount,
          grossAmount,
          status: TaxInvoiceStatus.DRAFT,
          description: input.description?.trim() || null,
          sourceType: input.sourceType || null,
          sourceId: input.sourceId || null,
        },
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "TaxInvoice",
        entityId: taxInvoice.id,
        newData: taxInvoice,
        reason: `Tạo hóa đơn VAT ${input.invoiceType === "OUTBOUND" ? "bán ra" : "mua vào"} số ${input.invoiceNumber}`,
      });

      LoggerService.info(`User ${userId} created TaxInvoice DRAFT: ${taxInvoice.id}`);
      return taxInvoice;
    });
  }

  /**
   * Update a Tax Invoice (only if in DRAFT state).
   */
  static async updateInvoice(
    id: string,
    input: {
      projectId?: string;
      contractId?: string;
      wbsId?: string;
      invoiceNumber: string;
      invoiceSeries: string;
      invoiceTemplate?: string;
      invoiceDate?: Date;
      partnerName: string;
      partnerTaxCode: string;
      partnerAddress?: string;
      netAmount: number;
      vatRate: number;
      vatAmount: number;
      description?: string;
      overrideReason?: string;
    },
    companyId: string,
    userId: string
  ) {
    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.DRAFT) {
      throw new ApiError(400, "LỖI HÓA ĐƠN: Chỉ được sửa hóa đơn ở trạng thái Nháp (DRAFT).");
    }

    const invDate = input.invoiceDate ? new Date(input.invoiceDate) : new Date();
    await assertPeriodNotLocked(invDate, companyId);

    // Validate Tax Math
    TaxPolicy.validateTaxMath(input.netAmount, input.vatRate, input.vatAmount, input.overrideReason);

    // Validate Unique Invoice Number + Series per company
    await TaxPolicy.assertUniqueInvoice(
      companyId,
      existing.invoiceType,
      input.invoiceNumber,
      input.invoiceSeries,
      id
    );

    const grossAmount = input.netAmount + input.vatAmount;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.taxInvoice.update({
        where: { id },
        data: {
          projectId: input.projectId || null,
          contractId: input.contractId || null,
          wbsId: input.wbsId || null,
          invoiceNumber: input.invoiceNumber.trim(),
          invoiceSeries: input.invoiceSeries.trim().toUpperCase(),
          invoiceTemplate: input.invoiceTemplate?.trim() || "1C26TBB",
          invoiceDate: invDate,
          partnerName: input.partnerName.trim(),
          partnerTaxCode: input.partnerTaxCode.trim(),
          partnerAddress: input.partnerAddress?.trim() || null,
          netAmount: input.netAmount,
          vatRate: input.vatRate,
          vatAmount: input.vatAmount,
          grossAmount,
          description: input.description?.trim() || null,
        },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        newData: updated,
        reason: `Cập nhật hóa đơn VAT số ${input.invoiceNumber}`,
      });

      LoggerService.info(`User ${userId} updated TaxInvoice DRAFT: ${id}`);
      return updated;
    });
  }

  /**
   * Delete a Tax Invoice (only if in DRAFT state).
   */
  static async deleteInvoice(id: string, companyId: string, userId: string) {
    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.DRAFT) {
      throw new ApiError(400, "LỖI HÓA ĐƠN: Chỉ được xóa hóa đơn ở trạng thái Nháp (DRAFT).");
    }

    await assertPeriodNotLocked(existing.invoiceDate, companyId);

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.taxInvoice.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        reason: `Xóa hóa đơn VAT số ${existing.invoiceNumber}`,
      });

      LoggerService.info(`User ${userId} soft-deleted TaxInvoice: ${id}`);
      return deleted;
    });
  }

  /**
   * Issue a Tax Invoice (Draft -> Issued). Locks fields from edits.
   */
  static async issueInvoice(id: string, companyId: string, userId: string) {
    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.DRAFT) {
      throw new ApiError(400, "LỖI HÓA ĐƠN: Chỉ phát hành được hóa đơn ở trạng thái Nháp (DRAFT).");
    }

    await assertPeriodNotLocked(existing.invoiceDate, companyId);

    return prisma.$transaction(async (tx) => {
      const issued = await tx.taxInvoice.update({
        where: { id },
        data: { status: TaxInvoiceStatus.ISSUED },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        newData: issued,
        reason: `Phát hành hóa đơn VAT số ${existing.invoiceNumber}`,
      });

      LoggerService.info(`TaxInvoice ISSUED: ${id}`);
      return issued;
    });
  }

  /**
   * Post a Tax Invoice (Issued -> Posted). Generates Double-entry Journal Entry.
   */
  static async postInvoice(id: string, companyId: string, userId: string) {
    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.ISSUED) {
      throw new ApiError(400, "LỖI GHI SỔ: Chỉ được ghi sổ hóa đơn ở trạng thái Đã Phát Hành (ISSUED).");
    }

    await assertPeriodNotLocked(existing.invoiceDate, companyId);

    return prisma.$transaction(async (tx) => {
      const lines: any[] = [];
      const net = Number(existing.netAmount);
      const vat = Number(existing.vatAmount);
      const gross = Number(existing.grossAmount);

      let refCode = `VAT-${existing.invoiceNumber}`;

      if (existing.invoiceType === TaxInvoiceType.OUTBOUND) {
        // Debit AR: 1310
        lines.push({ accountCode: "1310", amount: gross, type: TransactionType.DEBIT });
        // Credit Rev: 5110
        lines.push({ accountCode: "5110", amount: net, type: TransactionType.CREDIT });
        // Credit Output VAT: 33311
        if (vat > 0) {
          lines.push({ accountCode: "33311", amount: vat, type: TransactionType.CREDIT });
        }
      } else {
        // Inbound VAT
        // Debit expense (WIP/Materials/Admin etc): default to 6270 for general subcontract cost if no project
        lines.push({ accountCode: "6270", amount: net, type: TransactionType.DEBIT });
        // Debit Input VAT: 1331
        if (vat > 0) {
          lines.push({ accountCode: "1331", amount: vat, type: TransactionType.DEBIT });
        }
        // Credit AP: 3310
        lines.push({ accountCode: "3310", amount: gross, type: TransactionType.CREDIT });
      }

      // Generate double entry via PostingEngine
      await PostingEngine.createDoubleEntry(tx, {
        projectId: existing.projectId,
        description: `Ghi sổ hóa đơn VAT ${existing.invoiceType === TaxInvoiceType.OUTBOUND ? "Bán ra" : "Mua vào"} số ${existing.invoiceNumber} - Ký hiệu ${existing.invoiceSeries}`,
        reference: refCode,
        sourceType: "TAX_INVOICE",
        sourceId: existing.id,
        lines,
      });

      const entry = await tx.journalEntry.findFirst({
        where: { sourceId: existing.id, sourceType: "TAX_INVOICE", deletedAt: null }
      });

      if (!entry) {
        throw new ApiError(500, "Lỗi hệ thống: Không thể tạo hoặc truy vấn bút toán hạch toán thuế.");
      }

      const posted = await tx.taxInvoice.update({
        where: { id },
        data: {
          status: TaxInvoiceStatus.POSTED,
          postedJournalEntryId: entry.id,
        },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        newData: posted,
        reason: `Ghi sổ hóa đơn VAT số ${existing.invoiceNumber}`,
      });

      LoggerService.info(`TaxInvoice POSTED successfully: ${id}. Entry ID: ${entry.id}`);
      return posted;
    });
  }

  /**
   * Cancel an Invoice (Draft or Issued -> Cancelled).
   */
  static async cancelInvoice(id: string, companyId: string, userId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "LỖI HỦY HÓA ĐƠN: Bạn bắt buộc phải cung cấp lý do hủy tối thiểu 5 ký tự.");
    }

    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.DRAFT && existing.status !== TaxInvoiceStatus.ISSUED) {
      throw new ApiError(400, "LỖI HỦY HÓA ĐƠN: Chỉ được hủy hóa đơn ở trạng thái Nháp (DRAFT) hoặc Đã phát hành (ISSUED).");
    }

    await assertPeriodNotLocked(existing.invoiceDate, companyId);

    return prisma.$transaction(async (tx) => {
      const cancelled = await tx.taxInvoice.update({
        where: { id },
        data: { status: TaxInvoiceStatus.CANCELLED, description: `${existing.description || ""} [HỦY: ${reason}]` },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        newData: cancelled,
        reason: `Hủy hóa đơn VAT số ${existing.invoiceNumber} với lý do: ${reason}`,
      });

      LoggerService.info(`TaxInvoice CANCELLED: ${id}`);
      return cancelled;
    });
  }

  /**
   * Reverse a Posted Invoice (Posted -> Reversed + generates reverse double entry).
   */
  static async reverseInvoice(id: string, companyId: string, userId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, "LỖI ĐẢO BÚT TOÁN: Bạn bắt buộc phải cung cấp lý do đảo bút toán tối thiểu 5 ký tự.");
    }

    const existing = await this.getInvoiceById(id, companyId);
    if (existing.status !== TaxInvoiceStatus.POSTED) {
      throw new ApiError(400, "LỖI ĐẢO BÚT TOÁN: Chỉ được đảo bút toán cho hóa đơn đã ghi sổ (POSTED).");
    }

    await assertPeriodNotLocked(existing.invoiceDate, companyId);

    return prisma.$transaction(async (tx) => {
      // Find original entry
      const originalEntry = await tx.journalEntry.findUnique({
        where: { id: existing.postedJournalEntryId! },
        include: { lines: true },
      });

      if (!originalEntry) {
        throw new ApiError(404, "Không tìm thấy bút toán gốc của hóa đơn để thực hiện đảo.");
      }

      // Let's query codes
      const accountIds = originalEntry.lines.map((l: any) => l.accountId);
      const accounts = await tx.ledgerAccount.findMany({ where: { id: { in: accountIds } } });
      const accountMap = new Map(accounts.map((a: any) => [a.id, a.code]));

      const lines = originalEntry.lines.map((l: any) => {
        const code = accountMap.get(l.accountId);
        if (!code) throw new ApiError(500, `Không tìm thấy mã tài khoản cho ID: ${l.accountId}`);
        return {
          accountCode: code,
          amount: Number(l.amount),
          type: l.type === TransactionType.DEBIT ? TransactionType.CREDIT : TransactionType.DEBIT,
        };
      });

      await PostingEngine.createDoubleEntry(tx, {
        projectId: existing.projectId,
        description: `Đảo bút toán hóa đơn VAT số ${existing.invoiceNumber} - Lý do: ${reason}`,
        reference: `REV-${existing.invoiceNumber}`,
        sourceType: "TAX_INVOICE_REVERSAL",
        sourceId: existing.id,
        lines,
      });

      const entry = await tx.journalEntry.findFirst({
        where: { sourceId: existing.id, sourceType: "TAX_INVOICE_REVERSAL", deletedAt: null }
      });

      if (!entry) {
        throw new ApiError(500, "Lỗi hệ thống: Không thể tạo hoặc truy vấn bút toán đảo thuế.");
      }

      // Update original entry to flag reversed
      await tx.journalEntry.update({
        where: { id: originalEntry.id },
        data: { isReversed: true, reversalRef: entry.id },
      });

      const reversed = await tx.taxInvoice.update({
        where: { id },
        data: {
          status: TaxInvoiceStatus.REVERSED,
          postedJournalEntryId: entry.id, // point to reversal entry now or keep track
        },
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "TaxInvoice",
        entityId: id,
        oldData: existing,
        newData: reversed,
        reason: `Đảo bút toán hóa đơn VAT số ${existing.invoiceNumber}`,
      });

      LoggerService.info(`TaxInvoice REVERSED successfully: ${id}. Reversal Entry ID: ${entry.id}`);
      return reversed;
    });
  }
}
