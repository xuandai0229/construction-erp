import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { InvoiceStatus, PaymentStatus, UserRole } from "@prisma/client";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";
import { RBAC, AppAction } from "@/lib/rbac";
import { OperationalService } from "./operational.service";

export class RevenueService {
  
  // ─── INVOICE ───────────────────────────────────────
  static async createInvoice(data: any) {
    assertValidEntity(data, "CreateInvoiceDTO");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");

    const amount = round(data.amount);

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
          createdById: data.createdById
        }
      });

      // Posting to Ledger
      await PostingEngine.postInvoice(tx, {
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        amount: amount,
        description: `Hóa đơn ${invoice.invoiceNumber || invoice.id} cho ${project.name}`
      });

      // Audit Logging
      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "Invoice",
        entityId: invoice.id,
        newData: invoice
      });

      return invoice;
    });
  }

  // ─── PAYMENT ───────────────────────────────────────
  static async createPayment(data: {
    invoiceId: string;
    amount: number;
    date?: string;
    description?: string;
    requestId?: string;
    userId?: string;
    userRole?: UserRole;
  }) {
    assertValidEntity(data, "CreatePaymentDTO");

    // 2. Fetch current invoice state
    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new ApiError(404, "Không tìm thấy hóa đơn");

    // ─── AUTHORIZATION ──────────────────────────────────
    if (data.userId && data.userRole) {
      await RBAC.authorize({
        userId: data.userId,
        userRole: data.userRole,
        action: AppAction.FINANCIAL_CREATE,
        projectId: invoice.projectId
      });
    }
    
    if (data.amount <= 0) throw new ApiError(400, "Số tiền thanh toán phải lớn hơn 0");
    const amount = round(data.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      if (data.requestId) {
        const existingPayment = await tx.payment.findUnique({
          where: { requestId: data.requestId }
        });
        if (existingPayment) {
          return existingPayment; // Return existing payment for retry safety
        }
      }

      // 2. Fetch current invoice state
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) throw new ApiError(404, "Không tìm thấy hóa đơn");

      // 3. Financial Integrity Checks
      const currentPaid = Number(invoice.paidAmount);
      const currentRemaining = Number(invoice.remainingAmount);

      if (amount > round(currentRemaining) + 0.01) { 
        throw new ApiError(400, `Số tiền thanh toán (${amount}) vượt quá số tiền còn lại (${round(currentRemaining)})`);
      }
      
      const newPaidAmount = round(currentPaid + amount);
      const newRemainingAmount = Math.max(0, round(Number(invoice.amount) - newPaidAmount));
      
      let newStatus: InvoiceStatus = "PARTIAL";
      if (newRemainingAmount <= 0) newStatus = "PAID";

      // 4. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          projectId: invoice.projectId,
          invoiceId: data.invoiceId,
          amount: amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          requestId: data.requestId,
        },
      });

      // 5. Update Invoice with OPTIMISTIC LOCKING
      const updatedInvoice = await tx.invoice.updateMany({
        where: { 
          id: data.invoiceId,
          version: invoice.version // Check if version matches what we read
        },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          version: { increment: 1 } // Increment version
        },
      });

      // If no row was updated, it means another transaction changed the version
      if (updatedInvoice.count === 0) {
        throw new ApiError(409, "Dữ liệu hóa đơn đã bị thay đổi bởi người khác. Vui lòng thử lại.");
      }

      // 6. Create a revenue record for project tracking
      await tx.revenue.create({
        data: {
          projectId: invoice.projectId,
          wbsId: invoice.wbsId,
          invoiceId: invoice.id,
          amount: amount,
          date: new Date(),
          status: "paid" as PaymentStatus,
          description: `Thanh toán cho hóa đơn ${invoice.invoiceNumber || invoice.id}`,
          createdById: data.userId,
        }
      });

      // 7. Posting to Ledger
      await PostingEngine.postPayment(tx, {
        paymentId: payment.id,
        projectId: invoice.projectId,
        amount: amount,
        description: `Thanh toán hóa đơn ${invoice.invoiceNumber || invoice.id}`
      });

      // 8. Audit Logging
      await AuditService.log({
        tx,
        userId: data.userId,
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        newData: payment,
        severity: "INFO",
        reason: `Ghi nhận thanh toán cho hóa đơn ${invoice.id}`,
        requestId: data.requestId
      });

      return payment;
    });
  }

  static async findInvoicesByProject(projectId: string, filters: any = {}) {
    const { page = 1, limit = 50 } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = { 
      projectId,
      deletedAt: null 
    };

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          payments: {
            where: { deletedAt: null }
          },
          wbs: { select: { name: true } }
        },
        orderBy: { issuedDate: "desc" },
        skip,
        take
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  static async deleteInvoice(id: string, userId?: string) {
    const existing = await prisma.invoice.findUnique({ 
      where: { id, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } }
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy hóa đơn hoặc đã bị xóa");

    if (existing.payments.length > 0) {
      throw new ApiError(400, "Không thể xóa hóa đơn đã có thanh toán. Vui lòng xóa các thanh toán trước.");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Reverse Ledger
      await PostingEngine.reverseEntries(tx, {
        sourceId: id,
        sourceType: "INVOICE",
        reason: "Xóa hóa đơn (Soft Delete)"
      });

      // 2. Audit
      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "Invoice",
        entityId: id,
        oldData: existing
      });

      // 3. Soft Delete
      return tx.invoice.update({ 
        where: { id },
        data: { deletedAt: new Date() }
      });
    });
  }

  static async deletePayment(id: string, userId?: string) {
    const existing = await prisma.payment.findUnique({ 
      where: { id, deletedAt: null },
      include: { invoice: true }
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy thanh toán hoặc đã bị xóa");

    return prisma.$transaction(async (tx) => {
      // 1. Reverse Ledger
      await PostingEngine.reverseEntries(tx, {
        sourceId: id,
        sourceType: "PAYMENT",
        reason: "Xóa thanh toán (Soft Delete)"
      });

      // 2. Update Invoice Balance
      const amount = Number(existing.amount);
      const newPaidAmount = round(Number(existing.invoice.paidAmount) - amount);
      const newRemainingAmount = round(Number(existing.invoice.remainingAmount) + amount);
      
      await tx.invoice.update({
        where: { id: existing.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newRemainingAmount <= 0 ? "PAID" : "PARTIAL",
          version: { increment: 1 }
        }
      });

      // 3. Audit
      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "Payment",
        entityId: id,
        oldData: existing
      });

      // 4. Soft Delete
      return tx.payment.update({ 
        where: { id },
        data: { deletedAt: new Date() }
      });
    });
  }

  // ─── REVENUE (Standalone, not Invoice-linked) ──────
  static async createRevenue(data: {
    projectId: string;
    wbsId: string;
    invoiceId?: string | null;
    amount: number;
    date?: string;
    status?: PaymentStatus;
    description?: string;
    createdById?: string;
  }) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");

    const amount = round(data.amount);

    return prisma.$transaction(async (tx) => {
      const item = await tx.revenue.create({
        data: {
          projectId: data.projectId,
          wbsId: data.wbsId,
          invoiceId: data.invoiceId ?? null,
          amount,
          date: data.date ? new Date(data.date) : new Date(),
          status: data.status ?? ("unpaid" as PaymentStatus),
          description: data.description ?? "",
          createdById: data.createdById,
        },
      });

      // Posting to Ledger
      await PostingEngine.postRevenue(tx, {
        revenueId: item.id,
        projectId: item.projectId,
        amount: amount,
        description: item.description || `Doanh thu từ ${wbs.name}`,
        isPaid: item.status === "paid"
      });

      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "Revenue",
        entityId: item.id,
        newData: item,
      });

      return item;
    });
  }

  static async updateRevenue(id: string, data: {
    status?: PaymentStatus;
    amount?: number;
    description?: string;
    date?: string;
    userId?: string;
  }) {
    const existing = await prisma.revenue.findUnique({ 
      where: { id, deletedAt: null } 
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy doanh thu hoặc đã bị xóa");

    // ─── PERIOD LOCK GUARD ──────────────────────────────
    const isLocked = await OperationalService.isPeriodLocked(existing.date);
    if (isLocked) {
      throw new ApiError(403, "Kỳ kế toán này đã được chốt sổ. Không thể sửa đổi dữ liệu quá khứ.");
    }

    const amountChanged = data.amount !== undefined && round(data.amount) !== Number(existing.amount);
    const newAmount = amountChanged ? round(data.amount!) : Number(existing.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Reverse old ledger entries if amount changed
      if (amountChanged) {
        await PostingEngine.reverseEntries(tx, {
          sourceId: id,
          sourceType: "REVENUE",
          reason: "Điều chỉnh doanh thu (Amount update)"
        });
      }

      // 2. Update Record
      const item = await tx.revenue.update({
        where: { id },
        data: {
          amount: newAmount,
          ...(data.status !== undefined && { status: data.status }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.date !== undefined && { date: new Date(data.date) }),
        },
      });

      // 3. Post new ledger entry if amount changed
      if (amountChanged) {
        await PostingEngine.postRevenue(tx, {
          revenueId: item.id,
          projectId: item.projectId,
          amount: newAmount,
          description: item.description || "Điều chỉnh doanh thu lẻ",
          isPaid: item.status === "paid"
        });
      }

      // 4. Audit Logging
      await AuditService.log({
        tx,
        userId: data.userId,
        action: amountChanged ? "REVERSE" : "UPDATE",
        entity: "Revenue",
        entityId: id,
        oldData: existing,
        newData: item,
        severity: amountChanged ? "WARNING" : "INFO",
        reason: amountChanged ? "Cập nhật số tiền doanh thu (Yêu cầu đảo bút toán)" : "Cập nhật thông tin doanh thu",
      });

      return item;
    });
  }

  static async deleteRevenue(id: string, userId?: string) {
    const existing = await prisma.revenue.findUnique({ 
      where: { id, deletedAt: null } 
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy doanh thu hoặc đã bị xóa");

    return prisma.$transaction(async (tx) => {
      await AuditService.log({
        userId,
        action: "DELETE",
        entity: "Revenue",
        entityId: id,
        oldData: existing
      });

      return tx.revenue.update({ 
        where: { id },
        data: { deletedAt: new Date() }
      });
    });
  }

  static async findRevenuesByProject(projectId: string) {
    return prisma.revenue.findMany({
      where: { 
        projectId,
        deletedAt: null
      },
      orderBy: { date: "desc" },
    });
  }
}

