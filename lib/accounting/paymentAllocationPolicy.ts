import { InvoiceStatus, PaymentStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { round } from "@/lib/math";

export class PaymentAllocationPolicy {
  static validatePaymentAllocationCreate(data: any) {
    if (!data.paymentId) throw new ApiError(400, "paymentId is required for allocation.");
    if (!data.invoiceId) throw new ApiError(400, "invoiceId is required for allocation.");
    if (data.amount === undefined || data.amount === null) throw new ApiError(400, "amount is required for allocation.");
    if (Number(data.amount) <= 0) throw new ApiError(400, "Allocation amount must be greater than 0.");
  }

  static validateAllocationAmount(amount: number) {
    if (amount <= 0) {
      throw new ApiError(400, "Số tiền phân bổ (allocation) phải lớn hơn 0");
    }
  }

  static validateInvoiceRemaining(allocationAmount: number, invoiceRemaining: number) {
    if (round(allocationAmount) > round(invoiceRemaining) + 0.01) {
      throw new ApiError(400, `Số tiền phân bổ (${allocationAmount}) vượt quá số tiền còn lại của hóa đơn (${invoiceRemaining})`);
    }
  }

  static validatePaymentUnallocatedAmount(allocationAmount: number, paymentUnallocatedAmount: number) {
    if (round(allocationAmount) > round(paymentUnallocatedAmount) + 0.01) {
      throw new ApiError(400, `Số tiền phân bổ (${allocationAmount}) vượt quá số tiền chưa phân bổ của thanh toán (${paymentUnallocatedAmount})`);
    }
  }

  static validateSameCompany(paymentCompanyId: string, invoiceCompanyId: string) {
    if (paymentCompanyId !== invoiceCompanyId) {
      throw new ApiError(400, "Payment và Invoice phải thuộc cùng một công ty (Tenant).");
    }
  }

  static validateSameCounterparty(paymentCounterpartyId: string | null, invoiceCounterpartyId: string | null) {
    if (paymentCounterpartyId && invoiceCounterpartyId && paymentCounterpartyId !== invoiceCounterpartyId) {
      throw new ApiError(400, "Payment và Invoice phải thuộc cùng một đối tác (Counterparty).");
    }
  }

  static validatePaymentStatus(status: string) {
    if (["REJECTED", "CANCELLED", "REVERSED"].includes(status)) {
      throw new ApiError(400, `Không thể phân bổ từ thanh toán có trạng thái ${status}`);
    }
  }

  static validateInvoiceStatus(status: string) {
    if (["DRAFT", "REJECTED", "CANCELLED", "REVERSED"].includes(status)) {
      throw new ApiError(400, `Không thể phân bổ vào hóa đơn có trạng thái ${status}`);
    }
  }

  static excludeDraftRejectedCancelledReversed(allocations: any[]) {
    return allocations.filter(a => 
      a.status !== "DRAFT" && 
      a.status !== "REJECTED" && 
      a.status !== "CANCELLED" && 
      a.status !== "REVERSED" &&
      a.isReversed !== true
    );
  }

  static calculateInvoicePaidFromAllocations(allocations: any[]): number {
    const validAllocations = this.excludeDraftRejectedCancelledReversed(allocations);
    const sum = validAllocations.reduce((acc, curr) => acc + Number(curr.amount), 0);
    return round(sum);
  }

  static calculateInvoiceRemainingFromAllocations(invoiceTotalAmount: number, allocations: any[]): number {
    const paid = this.calculateInvoicePaidFromAllocations(allocations);
    return Math.max(0, round(invoiceTotalAmount - paid));
  }

  static calculatePaymentAllocatedAmount(allocations: any[]): number {
    const validAllocations = this.excludeDraftRejectedCancelledReversed(allocations);
    const sum = validAllocations.reduce((acc, curr) => acc + Number(curr.amount), 0);
    return round(sum);
  }

  static calculatePaymentUnallocatedAmount(paymentTotalAmount: number, allocations: any[]): number {
    const allocated = this.calculatePaymentAllocatedAmount(allocations);
    return Math.max(0, round(paymentTotalAmount - allocated));
  }
}
