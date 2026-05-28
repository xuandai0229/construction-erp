export class SourceDocumentPolicy {
  /**
   * Đảm bảo Invoice phải có Contract hoặc exception.
   */
  static validateInvoiceSource(data: { contractId?: string; acceptanceId?: string; exceptionReason?: string }) {
    if (!data.contractId && !data.acceptanceId && !data.exceptionReason) {
      throw new Error("LỖI NGHIỆP VỤ: Hóa đơn bắt buộc phải liên kết với Hợp đồng (contractId), Nghiệm thu (acceptanceId) hoặc có Lý do ngoại lệ (exceptionReason).");
    }
    
    if (!data.contractId && data.exceptionReason) {
      // In a real app, we might check if user role is allowed to bypass.
      if (data.exceptionReason.trim().length < 10) {
        throw new Error("LỖI NGHIỆP VỤ: Lý do ngoại lệ quá ngắn, vui lòng giải trình rõ ràng.");
      }
    }
  }

  /**
   * Đảm bảo Payment phải có Invoice hoặc Contract.
   */
  static validatePaymentSource(data: { invoiceId?: string; contractId?: string }) {
    if (!data.invoiceId && !data.contractId) {
      throw new Error("LỖI NGHIỆP VỤ: Thanh toán bắt buộc phải liên kết với Hóa đơn (invoiceId) hoặc Hợp đồng (contractId). Không tạo thanh toán mồ côi.");
    }
  }
}
