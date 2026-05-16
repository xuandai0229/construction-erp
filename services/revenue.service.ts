import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { assertPeriodNotLocked } from "@/lib/period";
import { LoggerService } from "./logger.service";
import { OperationalService } from "./operational.service";

export class RevenueService {
  
  // ─── INVOICE ───────────────────────────────────────
  static async createInvoice(data: any, userId?: string) {
    assertValidEntity(data, "CreateInvoiceDTO");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");

    const amount = round(data.amount);
    if (amount <= 0) throw new ApiError(400, "Số tiền hóa đơn phải lớn hơn 0");
    await assertPeriodNotLocked(data.issuedDate || new Date());

    const { requestId } = data;
    if (requestId) {
      const existing = await prisma.invoice.findUnique({ where: { requestId } });
      if (existing) return existing;
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          projectId: data.projectId,
          wbsId: data.wbsId,
          invoiceNumber: data.invoiceNumber,
          amount: amount,
          issuedDate: data.issuedDate ? new Date(data.issuedDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          remainingAmount: amount,
          status: "DRAFT",
          note: data.note,
          createdById: data.createdById,
          approvalStatus: "DRAFT",
          requestId: requestId
        }
      });

      // Audit Logging
      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "Invoice",
        entityId: invoice.id,
        newData: invoice,
        requestId
      });

      await LoggerService.info(`InvoiceCreated: ${invoice.invoiceNumber || invoice.id}`, { 
        requestId, 
        userId: data.createdById, 
        projectId: invoice.projectId,
        amount: invoice.amount 
      });

      return invoice;
    });
  }

  // ─── PAYMENT ───────────────────────────────────────
  static async createPayment(data: any, userId?: string) {
    assertValidEntity(data, "CreatePaymentDTO");
    
    if (data.amount <= 0) throw new ApiError(400, "Số tiền thanh toán phải lớn hơn 0");
    const amount = round(data.amount);
    await assertPeriodNotLocked(data.date || new Date());

    const { requestId } = data;
    if (requestId) {
      const existing = await prisma.payment.findUnique({ where: { requestId } });
      if (existing) return existing;
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) throw new ApiError(404, "Không tìm thấy hóa đơn");

      if (amount > round(Number(invoice.remainingAmount)) + 0.01) { 
        throw new ApiError(400, `Số tiền thanh toán (${amount}) vượt quá số tiền còn lại (${round(Number(invoice.remainingAmount))})`);
      }
      
      const newPaidAmount = round(Number(invoice.paidAmount) + amount);
      const newRemainingAmount = Math.max(0, round(Number(invoice.amount) - newPaidAmount));
      
      let newStatus: InvoiceStatus = "PARTIAL";
      if (newRemainingAmount <= 0) newStatus = "PAID";

      const payment = await tx.payment.create({
        data: {
          projectId: invoice.projectId,
          invoiceId: data.invoiceId,
          amount: amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          approvalStatus: "DRAFT",
          requestId: requestId
        },
      });

      await tx.invoice.update({
        where: { id: data.invoiceId, version: invoice.version }, // Optimistic Locking
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          version: { increment: 1 }
        },
      });

      // Create a revenue record for project tracking
      await tx.revenue.create({
        data: {
          projectId: invoice.projectId,
          wbsId: invoice.wbsId,
          invoiceId: invoice.id,
          amount: amount,
          date: new Date(),
          status: "paid" as PaymentStatus,
          description: `Thanh toán cho hóa đơn ${invoice.invoiceNumber || invoice.id}`
        }
      });

      // Posting to Ledger
      await PostingEngine.postPayment(tx, {
        paymentId: payment.id,
        projectId: invoice.projectId,
        amount: amount,
        description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`
      });

      // Audit Logging
      await AuditService.log({
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        newData: payment,
        requestId
      });

      await LoggerService.info(`PaymentCreated: ${payment.id} for Invoice ${invoice.id}`, { 
        requestId, 
        projectId: invoice.projectId,
        invoiceId: invoice.id,
        amount: amount 
      });

      return payment;
    });
  }

  static async findInvoicesByProject(projectId: string, filters: any = {}) {
    const { limit, skip } = filters;
    return prisma.invoice.findMany({
      where: { projectId, deletedAt: null },
      include: {
        payments: true,
        wbs: { select: { name: true } }
      },
      skip: skip ? Number(skip) : 0,
      orderBy: { issuedDate: "desc" }
    }).then(items => items.map(inv => ({
      ...inv,
      ux: OperationalService.getInvoiceGuidance(inv)
    })));
  }

  static async findRevenuesByProject(projectId: string, filters: any = {}) {
    const { limit, skip } = filters;
    return prisma.revenue.findMany({
      where: { projectId, deletedAt: null },
      take: limit ? Number(limit) : 500,
      skip: skip ? Number(skip) : 0,
      orderBy: { date: "desc" }
    });
  }

  static async findPaymentsByProject(projectId: string, filters: any = {}) {
    const { limit, skip } = filters;
    return prisma.payment.findMany({
      where: { projectId, deletedAt: null },
      take: limit ? Number(limit) : 500,
      skip: skip ? Number(skip) : 0,
      orderBy: { date: "desc" }
    });
  }

  static async updateInvoice(id: string, updates: any) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn");
    
    return prisma.$transaction(async (tx) => {
      // GOVERNANCE: Block update if invoice is already POSTED or PAID
      if (existing.status !== "DRAFT") {
        throw new ApiError(400, `Không thể sửa hóa đơn đã ${existing.status}. Vui lòng sử dụng quy trình điều chỉnh.`);
      }

      const updated = await tx.invoice.update({
        where: { id, version: existing.version },
        data: {
          ...updates,
          version: { increment: 1 }
        }
      });
      await AuditService.log({
        action: "UPDATE",
        entity: "Invoice",
        entityId: id,
        oldData: existing,
        newData: updated
      });
      return updated;
    });
  }

  static async updatePayment(id: string, updates: any) {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy thanh toán");
    
    return prisma.$transaction(async (tx) => {
      // GOVERNANCE: Payments are immutable once created.
      throw new ApiError(400, "Thanh toán là chứng từ không thể sửa đổi sau khi phát hành. Vui lòng hủy và tạo lại nếu cần.");
    });
  }

  static async deleteInvoice(id: string, userId: string, reason: string) {
    if (!reason) throw new ApiError(400, "Lý do hủy hóa đơn là bắt buộc cho mục đích kiểm soát.");
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn");

    await assertPeriodNotLocked(existing.issuedDate);

    return prisma.$transaction(async (tx) => {
      const item = await tx.invoice.update({
        where: { id, version: existing.version }, // Optimistic Locking
        data: { 
          deletedAt: new Date(),
          deletedById: userId,
          version: { increment: 1 }
        }
      });

      // 1. Soft delete payments
      const payments = await tx.payment.findMany({ where: { invoiceId: id, deletedAt: null } });
      for (const pay of payments) {
        await tx.payment.update({
          where: { id: pay.id },
          data: { deletedAt: new Date(), deletedById: userId }
        });
        await PostingEngine.reverseJournal(tx, pay.id, "PAYMENT", userId || "SYSTEM");
      }

      // 2. Soft delete related revenue records
      await tx.revenue.updateMany({
        where: { invoiceId: id, deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // 3. Reverse Journal for Invoice
      await PostingEngine.reverseJournal(tx, id, "INVOICE", userId || "SYSTEM");

      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "Invoice",
        entityId: id,
        oldData: existing,
        reason: `Hủy hóa đơn: ${reason}`,
      });

      await LoggerService.info(`InvoiceDeleted: ${id}`, { userId, invoiceId: id, reason });

      return item;
    });
  }

  static async updateInvoiceApproval(id: string, status: "APPROVED" | "REJECTED" | "PENDING", userId?: string) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn");

    return prisma.$transaction(async (tx) => {
      const item = await tx.invoice.update({
        where: { id },
        data: { 
          approvalStatus: status,
          // Sync Invoice Status if approved
          ...(status === "APPROVED" && existing.status === "DRAFT" && { status: "SENT" })
        }
      });

      // 1. Post to Ledger if Approved
      if (status === "APPROVED") {
        await PostingEngine.postInvoice(tx, {
          invoiceId: item.id,
          projectId: item.projectId,
          amount: Number(item.amount),
          description: `Phê duyệt hóa đơn ${item.invoiceNumber || item.id}`
        });
      }

      await AuditService.log({
        userId,
        action: status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "UPDATE",
        entity: "Invoice",
        entityId: id,
        oldData: existing,
        newData: item,
      });

      return item;
    });
  }

  static async updatePaymentApproval(id: string, status: "APPROVED" | "REJECTED" | "PENDING", userId?: string) {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy thanh toán");

    const item = await prisma.payment.update({
      where: { id },
      data: { approvalStatus: status }
    });

    await AuditService.log({
      userId,
      action: status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "UPDATE",
      entity: "Payment",
      entityId: id,
      oldData: existing,
      newData: item,
    });

    return item;
  }

  static async bulkUpdateInvoiceApproval(ids: string[], status: "APPROVED" | "REJECTED", userId?: string) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const id of ids) {
        const inv = await tx.invoice.update({
          where: { id },
          data: { approvalStatus: status }
        });
        
        await AuditService.log({
          userId,
          action: status === "APPROVED" ? "APPROVE" : "REJECT",
          entity: "Invoice",
          entityId: inv.id,
          newData: inv
        });
        results.push(inv);
      }
      return results;
    });
  }

  static async restoreInvoice(id: string, userId: string, reason: string) {
    if (!reason) throw new ApiError(400, "Lý do khôi phục hóa đơn là bắt buộc.");
    
    // We must use raw query to bypass the soft-delete filter in lib/prisma.ts
    const existing: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Invoice" WHERE id = $1`, id);
    if (!existing || existing.length === 0) throw new ApiError(404, "Không tìm thấy hóa đơn");
    const invoice = existing[0];
    // console.log("DEBUG: Restoring invoice", invoice);
    
    return prisma.$transaction(async (tx) => {
      // 1. Restore the record
      const item = await tx.invoice.update({
        where: { id, version: Number(invoice.version) },
        data: { 
          deletedAt: null,
          version: { increment: 1 }
        }
      });

      // 2. Repost to Ledger
      await PostingEngine.postInvoice(tx, {
        invoiceId: id,
        projectId: invoice.projectId,
        amount: Number(invoice.amount),
        description: `Khôi phục hóa đơn: ${invoice.invoiceNumber || id}`
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "Invoice",
        entityId: id,
        newData: item,
        reason: `Khôi phục hóa đơn: ${reason}`
      });

      await LoggerService.info(`InvoiceRestored: ${id}`, { userId, invoiceId: id, reason });

      return item;
    });
  }

  static async restorePayment(id: string, userId: string, reason: string) {
    if (!reason) throw new ApiError(400, "Lý do khôi phục thanh toán là bắt buộc.");
    const existing: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Payment" WHERE id = $1`, id);
    if (!existing || existing.length === 0) throw new ApiError(404, "Không tìm thấy thanh toán");
    const payment = existing[0];

    return prisma.$transaction(async (tx) => {
      // 1. Restore the record
      const item = await tx.payment.update({
        where: { id, version: Number(payment.version) },
        data: { 
          deletedAt: null,
          version: { increment: 1 }
        }
      });

      // 2. Repost to Ledger
      await PostingEngine.postPayment(tx, {
        paymentId: id,
        projectId: payment.projectId,
        amount: Number(payment.amount),
        description: `Khôi phục thanh toán hóa đơn ${id}`
      });

      await AuditService.log({
        userId,
        action: "UPDATE",
        entity: "Payment",
        entityId: id,
        newData: item,
        reason: `Khôi phục thanh toán: ${reason}`
      });

      await LoggerService.info(`PaymentRestored: ${id}`, { userId, paymentId: id, reason });

      return item;
    });
  }
}
