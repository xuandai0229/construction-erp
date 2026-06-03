import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export class TaxPolicy {
  /**
   * Kiểm tra tiền thuế GTGT: vatAmount được lệch tối đa 10 đ so với netAmount * vatRate.
   * Nếu vượt dung sai, người dùng phải nhập lý do ghi đè.
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
          `LỖI TÍNH TOÁN THUẾ: Tiền thuế GTGT thực tế (${vatAmount.toLocaleString("vi-VN")} đ) lệch quá dung sai cho phép (10 đ) so với tiền thuế lý thuyết (${expectedVat.toLocaleString("vi-VN")} đ - mức ${vatRate}%). Bạn phải nhập lý do giải trình ghi đè, tối thiểu 5 ký tự.`
        );
      }
    }
  }

  /**
   * Kiểm tra trùng số hóa đơn và ký hiệu hóa đơn trong cùng công ty.
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
