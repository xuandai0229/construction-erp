export class AdvanceSettlementPolicy {
  static validateAdvanceCreate(data: { projectId?: string; contractId?: string; supplierId?: string; employeeId?: string; amount: number }) {
    if (!data.projectId && !data.contractId) {
      throw new Error("LỖI NGHIỆP VỤ: Đề nghị tạm ứng phải gắn với Công trình hoặc Hợp đồng.");
    }
    if (!data.supplierId && !data.employeeId) {
      throw new Error("LỖI NGHIỆP VỤ: Đề nghị tạm ứng phải chỉ định rõ đối tượng nhận (Nhà cung cấp hoặc Nhân viên).");
    }
    if (data.amount <= 0) {
      throw new Error("LỖI NGHIỆP VỤ: Số tiền tạm ứng phải lớn hơn 0.");
    }
  }

  static validateAdvanceApprove(currentStatus: string, isCreator: boolean) {
    if (currentStatus !== "SUBMITTED") {
      throw new Error("LỖI NGHIỆP VỤ: Chỉ được duyệt tạm ứng khi ở trạng thái SUBMITTED.");
    }
    if (isCreator) {
      throw new Error("LỖI NGHIỆP VỤ: Nguyên tắc SoD - Người tạo không được tự phê duyệt tạm ứng.");
    }
  }

  static validateAdvancePaymentPost(currentStatus: string, isPeriodLocked: boolean) {
    if (currentStatus === "DRAFT") {
      throw new Error("LỖI NGHIỆP VỤ: Không thể chi tiền/ghi sổ tạm ứng đang ở nháp (DRAFT).");
    }
    if (currentStatus === "PAID") {
      throw new Error("LỖI NGHIỆP VỤ: Tạm ứng này đã được chi tiền (PAID), không được ghi sổ lại.");
    }
    if (isPeriodLocked) {
      throw new Error("LỖI NGHIỆP VỤ: Kỳ kế toán đã khóa, không thể ghi sổ chi tạm ứng.");
    }
  }

  static validateSettlement(advanceStatus: string, invoiceStatus: string, settleAmount: number, advanceRemaining: number, invoiceRemaining: number) {
    if (advanceStatus !== "PAID" && advanceStatus !== "PARTIALLY_SETTLED") {
      throw new Error("LỖI NGHIỆP VỤ: Không thể hoàn ứng khi chứng từ tạm ứng chưa xuất tiền (PAID).");
    }
    if (invoiceStatus === "DRAFT") {
      throw new Error("LỖI NGHIỆP VỤ: Không thể hoàn ứng với chứng từ Hóa đơn/Chi phí đang nháp.");
    }
    if (settleAmount > advanceRemaining) {
      throw new Error("LỖI NGHIỆP VỤ: Số tiền hoàn ứng vượt quá số dư tạm ứng còn lại.");
    }
    if (settleAmount > invoiceRemaining) {
      throw new Error("LỖI NGHIỆP VỤ: Số tiền hoàn ứng vượt quá số nợ còn lại của hóa đơn.");
    }
  }

  static validateOffset(docA: any, docB: any, overrideRole: boolean) {
    if (docA.companyId !== docB.companyId) {
      throw new Error("LỖI NGHIỆP VỤ: Không được phép đối trừ chéo công ty (Cross-company).");
    }
    const isSameSubject = (docA.supplierId === docB.supplierId) || (docA.employeeId === docB.employeeId) || (docA.supplierId && docA.supplierId === docB.contract?.supplierId);
    if (!isSameSubject && !overrideRole) {
      throw new Error("LỖI NGHIỆP VỤ: Không được đối trừ sai đối tượng (khác nhà cung cấp/nhân viên) trừ khi có quyền ghi đè.");
    }
  }
}
