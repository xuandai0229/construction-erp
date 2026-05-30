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
  PAID: "Đã thanh toán",
  PARTIAL: "Thanh toán một phần",
  OVERDUE: "Quá hạn",
  PENDING: "Đang chờ",
  FAILED: "Thất bại",
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
  COMPLETED: "Hoàn thành",
  IN_PROGRESS: "Đang thực hiện",
  REJECTED: "Từ chối",
};

export function getStatusLabel(status: string): string {
  if (!status) return "";
  return StatusLabelMap[status.toUpperCase()] || status;
}
