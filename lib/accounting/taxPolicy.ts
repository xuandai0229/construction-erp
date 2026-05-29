import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export class TaxPolicy {
  /**
   * Validates the math of a VAT invoice: vatAmount must be within a tolerance of 10 VND of netAmount * (vatRate / 100).
   * If not, an overrideReason of at least 5 characters is required.
   */
  static validateTaxMath(
    netAmount: number,
    vatRate: number,
    vatAmount: number,
    overrideReason?: string
  ) {
    const expectedVat = Math.round(netAmount * (vatRate / 100));
    const difference = Math.abs(vatAmount - expectedVat);

    if (difference > 10) {
      if (!overrideReason || overrideReason.trim().length < 5) {
        throw new ApiError(
          400,
          `LỖI TÍNH TOÁN THUẾ: Tiền thuế GTGT thực tế (${vatAmount.toLocaleString()} VND) lệch quá dung sai cho phép (10 VND) so với tiền thuế lý thuyết (${expectedVat.toLocaleString()} VND - mức ${vatRate}%). Bạn bắt buộc phải cung cấp lý do giải trình ghi đè (tối thiểu 5 ký tự).`
        );
      }
    }
  }

  /**
   * Asserts that a tax invoice number + series is unique for a given company and invoice type.
   */
  static async assertUniqueInvoice(
    companyId: string,
    invoiceType: "OUTBOUND" | "INBOUND",
    invoiceNumber: string,
    invoiceSeries: string,
    excludeId?: string
  ) {
    const existing = await prisma.taxInvoice.findFirst({
      where: {
        companyId,
        invoiceType,
        invoiceNumber,
        invoiceSeries,
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });

    if (existing) {
      throw new ApiError(
        400,
        `LỖI TRÙNG HÓA ĐƠN: Hóa đơn ${invoiceType === "OUTBOUND" ? "bán ra" : "mua vào"} số ${invoiceNumber}, ký hiệu ${invoiceSeries} đã tồn tại trong hệ thống của công ty.`
      );
    }
  }
}
