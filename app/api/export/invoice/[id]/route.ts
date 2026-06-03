import { handleApiError, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { generateCsvResponse } from "@/lib/export/accountingExport";

const statusLabel = (status?: string | null) => ({
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  POSTED: "Đã ghi sổ",
  PAID: "Đã thanh toán",
  PARTIAL: "Thanh toán một phần",
  OVERDUE: "Quá hạn",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
  REJECTED: "Từ chối",
}[status || ""] || status || "");

const formatVnd = (value: unknown) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAccountingAccess("EXPORT");
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { wbs: true }
    });

    if (!invoice || invoice.deletedAt) {
      throw new ApiError(404, "Không tìm thấy hóa đơn.");
    }

    await requireProjectAccess(user, invoice.projectId);

    const project = await prisma.project.findUnique({
      where: { id: invoice.projectId }
    });

    const headers = [
      "Thuộc tính",
      "Giá trị chi tiết"
    ];

    const rows = [
      ["Mã hóa đơn", invoice.invoiceNumber || invoice.id],
      ["Dự án", project?.name || ""],
      ["Hạng mục WBS", invoice.wbs?.name || ""],
      ["Ngày phát hành", invoice.issuedDate.toLocaleDateString("vi-VN")],
      ["Ngày đáo hạn", invoice.dueDate ? invoice.dueDate.toLocaleDateString("vi-VN") : "-"],
      ["Giá trị trước thuế", formatVnd(Number(invoice.amount) - Number(invoice.vatAmount))],
      ["Thuế suất VAT (%)", String(invoice.vatRate)],
      ["Tiền thuế VAT", formatVnd(invoice.vatAmount)],
      ["Tổng giá trị hóa đơn", formatVnd(invoice.amount)],
      ["Đã thanh toán", formatVnd(invoice.paidAmount)],
      ["Còn lại phải thu", formatVnd(invoice.remainingAmount)],
      ["Trạng thái duyệt", statusLabel(invoice.approvalStatus)],
      ["Trạng thái thanh toán", statusLabel(invoice.status)],
      ["Ngày tạo", invoice.createdAt.toLocaleString("vi-VN")]
    ];

    const filename = `Chi_tiet_hoa_don_${invoice.invoiceNumber || invoice.id}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: invoice.projectId,
      reportType: "INVOICE_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuất chi tiết hóa đơn ${invoice.invoiceNumber || invoice.id}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
