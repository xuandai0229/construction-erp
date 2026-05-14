
import { InvoiceStatus, ProjectStatus } from "@/app/types";

export interface OperationalGuidance {
  statusLabel: string;
  nextActions: { action: string; label: string; primary?: boolean }[];
  guidance: string;
  severity: "info" | "warning" | "error" | "success";
}

export class OperationalService {
  /**
   * Provides guidance for an Invoice based on its state
   */
  static getInvoiceGuidance(invoice: any): OperationalGuidance {
    const status = invoice.status as InvoiceStatus;
    
    if (invoice.deletedAt) {
      return {
        statusLabel: "Đã hủy",
        nextActions: [{ action: "RESTORE", label: "Khôi phục" }],
        guidance: "Hóa đơn đã bị hủy và đảo sổ. Khôi phục sẽ tạo bút toán ngược lại.",
        severity: "error"
      };
    }

    switch (status) {
      case "DRAFT":
        return {
          statusLabel: "Nháp",
          nextActions: [
            { action: "SEND", label: "Gửi hóa đơn", primary: true },
            { action: "EDIT", label: "Chỉnh sửa" },
            { action: "DELETE", label: "Hủy bỏ" }
          ],
          guidance: "Hóa đơn chưa gửi cho chủ đầu tư. Vui lòng kiểm tra kỹ số liệu trước khi gửi.",
          severity: "info"
        };
      case "SENT":
        return {
          statusLabel: "Đã gửi",
          nextActions: [
            { action: "PAY", label: "Ghi nhận thanh toán", primary: true },
            { action: "DELETE", label: "Hủy bỏ" }
          ],
          guidance: "Đang chờ chủ đầu tư xác nhận và thanh toán.",
          severity: "success"
        };
      case "PARTIAL":
        return {
          statusLabel: "Thanh toán một phần",
          nextActions: [
            { action: "PAY", label: "Thanh toán tiếp", primary: true }
          ],
          guidance: "Chủ đầu tư đã thanh toán một phần. Tiếp tục theo dõi công nợ còn lại.",
          severity: "warning"
        };
      case "PAID":
        return {
          statusLabel: "Đã thanh toán",
          nextActions: [],
          guidance: "Hóa đơn đã hoàn tất. Chứng từ hiện không thể chỉnh sửa.",
          severity: "success"
        };
      case "OVERDUE":
        return {
          statusLabel: "Quá hạn",
          nextActions: [
            { action: "PAY", label: "Ghi nhận thanh toán", primary: true },
            { action: "REMIND", label: "Gửi nhắc nợ" }
          ],
          guidance: "Hóa đơn đã quá hạn thanh toán. Vui lòng liên hệ bộ phận kế toán của chủ đầu tư.",
          severity: "error"
        };
      default:
        return {
          statusLabel: "Không xác định",
          nextActions: [],
          guidance: "Trạng thái không hợp lệ.",
          severity: "info"
        };
    }
  }

  /**
   * Provides guidance for Project Risk
   */
  static getProjectRiskGuidance(riskProfile: any): OperationalGuidance {
    if (riskProfile.riskScore > 70) {
      return {
        statusLabel: "Rủi ro cao",
        nextActions: [{ action: "AUDIT", label: "Kiểm toán ngay", primary: true }],
        guidance: riskProfile.flags.join(". ") || "Dự án đang gặp nhiều vấn đề nghiêm trọng.",
        severity: "error"
      };
    } else if (riskProfile.riskScore > 40) {
      return {
        statusLabel: "Cảnh báo",
        nextActions: [{ action: "REVIEW", label: "Xem xét ngân sách" }],
        guidance: "Dự án có dấu hiệu vượt định mức hoặc chậm thanh toán.",
        severity: "warning"
      };
    }
    return {
      statusLabel: "Ổn định",
      nextActions: [],
      guidance: "Dự án đang vận hành đúng kế hoạch.",
      severity: "success"
    };
  }
}
