import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { assertPeriodNotLocked } from "@/lib/period";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";
import { PaymentStatus } from "@prisma/client";

export class PaymentService {
  
  // ==========================================
  // TRUE AP PAYMENT FLOW (Vendor Payment)
  // ==========================================
  static async createVendorPayment(data: {
    costRecordId: string;
    amount: number;
    paymentDate?: Date;
    note?: string;
    reference?: string;
  }, userId: string) {
    if (data.amount <= 0) throw new ApiError(400, "LỖI KẾ TOÁN: Số tiền thanh toán phải lớn hơn 0");
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    await assertPeriodNotLocked(paymentDate);

    return prisma.$transaction(async (tx) => {
      const cost = await tx.costRecord.findUnique({
        where: { id: data.costRecordId },
        include: { vendorPayments: { where: { isReversed: false, deletedAt: null } } }
      });
      if (!cost) throw new ApiError(404, "Không tìm thấy khoản chi phí AP");
      if (cost.deletedAt) throw new ApiError(400, "Không thể thanh toán cho khoản chi phí đã bị xóa");
      
      const totalPaid = cost.vendorPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(cost.amount) - totalPaid;
      
      if (data.amount > remaining + 0.01) {
        throw new ApiError(400, `LỖI KẾ TOÁN: Số tiền thanh toán (${data.amount}) vượt quá công nợ còn lại (${remaining})`);
      }

      // Generate Payment No
      const yearMonth = paymentDate.toISOString().slice(0, 7).replace('-', '');
      const count = await tx.vendorPayment.count({ where: { paymentNo: { startsWith: `VP-${yearMonth}` } } });
      const paymentNo = `VP-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

      // Create True Vendor Payment
      const vp = await tx.vendorPayment.create({
        data: {
          paymentNo,
          projectId: cost.projectId,
          costRecordId: cost.id,
          amount: data.amount,
          paymentDate,
          note: data.note,
          reference: data.reference,
          status: (data.amount >= remaining - 0.01) ? "paid" : "unpaid"
        }
      });

      // Update CostRecord status for UI compatibility
      const newStatus = (data.amount >= remaining - 0.01) ? "paid" : "unpaid";
      await tx.costRecord.update({
        where: { id: cost.id, version: cost.version },
        data: { status: newStatus as PaymentStatus, version: { increment: 1 } }
      });

      // Post to Ledger (AP Payment)
      await PostingEngine.createDoubleEntry(tx, {
        projectId: cost.projectId,
        description: `Thanh toán chi phí ${cost.id}: ${data.note || ''}`,
        reference: paymentNo,
        sourceType: "VENDOR_PAYMENT",
        sourceId: vp.id,
        lines: [
          { accountCode: "3310", amount: data.amount, type: "DEBIT" }, // Dr AP
          { accountCode: "1020", amount: data.amount, type: "CREDIT" }, // Cr Bank/Cash
        ]
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "VendorPayment",
        entityId: vp.id,
        newData: vp,
        reason: "Thanh toán cho nhà cung cấp (AP Payment)",
      });

      return vp;
    });
  }

  static async reverseVendorPayment(id: string, userId: string, reason: string) {
    if (!reason) throw new ApiError(400, "Phải nhập lý do Hủy bút toán (Reversal Reason)");

    return prisma.$transaction(async (tx) => {
      const vp = await tx.vendorPayment.findUnique({ where: { id }, include: { costRecord: true } });
      if (!vp) throw new ApiError(404, "Không tìm thấy phiếu thanh toán");
      if (vp.isReversed) throw new ApiError(400, "Phiếu thanh toán này đã được Hủy (Reversed) trước đó");

      await assertPeriodNotLocked(new Date()); // Reversal happens in current period

      // Mark as reversed with OCC
      const updatedVp = await tx.vendorPayment.update({
        where: { id, version: vp.version },
        data: { isReversed: true, reversalRef: `REV-${vp.paymentNo || vp.id}`, deletedById: userId, version: { increment: 1 } }
      });

      // Restore CostRecord status
      await tx.costRecord.update({
        where: { id: vp.costRecordId },
        data: { status: "unpaid", version: { increment: 1 } } // Unpaid or partial based on remaining logic, keeping simple for now
      });

      // Reverse Journal
      await PostingEngine.reverseJournal(tx, vp.id, "VENDOR_PAYMENT", userId);

      await AuditService.log({
        userId,
        action: "REVERSE",
        entity: "VendorPayment",
        entityId: vp.id,
        oldData: vp,
        reason: `Hủy bút toán thanh toán: ${reason}`
      });

      return updatedVp;
    });
  }

  // ==========================================
  // TRUE AR PAYMENT ALLOCATION FLOW
  // ==========================================
  static async allocateARPayment(data: {
    paymentId: string;
    invoiceId: string;
    amount: number;
  }, userId: string) {
    if (data.amount <= 0) throw new ApiError(400, "LỖI KẾ TOÁN: Số tiền phân bổ phải lớn hơn 0");

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: data.paymentId } });
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
      
      if (!payment || !invoice) throw new ApiError(404, "Không tìm thấy phiếu thu hoặc hóa đơn");
      if (payment.deletedAt || invoice.deletedAt) throw new ApiError(400, "Không thể thao tác trên chứng từ đã xóa");

      await assertPeriodNotLocked(new Date());

      // Validate Payment Remaining Amount
      const existingAllocs = await tx.paymentAllocation.aggregate({
        where: { paymentId: data.paymentId, isReversed: false },
        _sum: { amount: true }
      });
      const allocated = Number(existingAllocs._sum?.amount || 0);
      const paymentRemaining = Number(payment.amount) - allocated;

      if (data.amount > paymentRemaining + 0.01) {
        throw new ApiError(400, `LỖI ĐỐI SOÁT: Số tiền phân bổ (${data.amount}) vượt quá số dư phiếu thu (${paymentRemaining})`);
      }

      // Validate Invoice Remaining Balance
      const invoiceAllocs = await tx.paymentAllocation.aggregate({
        where: { invoiceId: data.invoiceId, isReversed: false },
        _sum: { amount: true }
      });
      const invoicePaid = Number(invoiceAllocs._sum?.amount || 0);
      const invoiceRemaining = Number(invoice.amount) - invoicePaid;

      if (data.amount > invoiceRemaining + 0.01) {
        throw new ApiError(400, `LỖI ĐỐI SOÁT: Số tiền phân bổ (${data.amount}) vượt quá công nợ hóa đơn (${invoiceRemaining})`);
      }

      // 1. Create Allocation
      const allocation = await tx.paymentAllocation.create({
        data: {
          paymentId: data.paymentId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          allocatedById: userId
        }
      });

      // 2. Update Invoice Balance
      const newInvoicePaid = invoicePaid + data.amount;
      const newInvoiceRemaining = Math.max(0, Number(invoice.amount) - newInvoicePaid);
      let newInvoiceStatus = "PARTIAL";
      if (newInvoiceRemaining <= 0.01) newInvoiceStatus = "PAID";

      await tx.invoice.update({
        where: { id: data.invoiceId, version: invoice.version },
        data: {
          paidAmount: newInvoicePaid,
          remainingAmount: newInvoiceRemaining,
          status: newInvoiceStatus as any,
          version: { increment: 1 }
        }
      });

      // 3. Update Payment Version (OCC Lock) to prevent Over-allocation Race Condition
      await tx.payment.update({
        where: { id: data.paymentId, version: payment.version },
        data: { version: { increment: 1 } }
      });

      // Allocation does NOT generate journal entry! 
      // AR Ledger is updated when Invoice is issued (Dr AR, Cr Rev) and when Payment is received (Dr Bank, Cr AR).
      // Allocation just matches them in the sub-ledger.

      await AuditService.log({
        userId,
        action: "ALLOCATE",
        entity: "PaymentAllocation",
        entityId: allocation.id,
        newData: allocation,
        reason: `Phân bổ phiếu thu vào hóa đơn ${invoice.invoiceNumber || invoice.id}`
      });

      return allocation;
    });
  }
}
