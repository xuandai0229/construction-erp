/**
 * Shared status and type mapping utilities for Vietnamese translation in UI.
 * Does not mutate backend values or business logic.
 */

export const StatusLabelMap: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  POSTED: "Đã ghi sổ",
  REVERSED: "Đã đảo chứng từ",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
  PAID: "Đã thanh toán",
  PARTIAL: "Thanh toán một phần",
  PARTIALLY_SETTLED: "Đã hoàn ứng một phần",
  FULLY_SETTLED: "Đã hoàn ứng xong",
  SETTLED: "Đã quyết toán",
  OVERDUE: "Quá hạn",
  PENDING: "Chờ xử lý",
  PENDING_PM: "Chờ chỉ huy công trình duyệt",
  PENDING_FINANCE: "Chờ kế toán duyệt",
  PENDING_DIRECTOR: "Chờ giám đốc duyệt",
  SENT: "Đã gửi",
  ISSUED: "Đã phát hành",
  FAILED: "Thất bại",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  SUCCESS: "Thành công",
  WARNING: "Cảnh báo",
  CRITICAL: "Nghiêm trọng",
  RED: "Đỏ",
  YELLOW: "Vàng",
  GREEN: "Xanh",
  DEBIT: "Nợ",
  CREDIT: "Có",
  PURCHASE_RECEIPT: "Phiếu nhập mua hàng",
  ISSUE_TO_PROJECT: "Phiếu xuất cho công trình",
  TRANSFER: "Phiếu chuyển kho",
  ADJUSTMENT: "Phiếu điều chỉnh",
  
  // Additional typical lifecycle/inventory types
  RECEIPT: "Nhập kho",
  ISSUE: "Xuất kho",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  IN_PROGRESS: "Đang thực hiện",
  REJECTED: "Từ chối",
};

export function getStatusLabel(status: string): string {
  if (!status) return "";
  return StatusLabelMap[status.toUpperCase()] || status;
}
