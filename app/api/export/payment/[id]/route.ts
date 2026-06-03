import { handleApiError, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { generateCsvResponse } from "@/lib/export/accountingExport";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAccountingAccess("EXPORT");
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment || payment.deletedAt) {
      throw new ApiError(404, "Không tìm thấy phiếu thanh toán.");
    }

    await requireProjectAccess(user, payment.projectId);

    const project = await prisma.project.findUnique({
      where: { id: payment.projectId }
    });

    const headers = [
      "Thuộc tính",
      "Giá trị chi tiết"
    ];

    const rows = [
      ["Mã phiếu thanh toán", payment.id],
      ["Dự án", project?.name || ""],
      ["Loại thanh toán", "Phiếu thu"],
      ["Phương thức", "Chuyển khoản ngân hàng"],
      ["Số tiền thanh toán", Number(payment.amount).toLocaleString("vi-VN") + " đ"],
      ["Ngày thanh toán", payment.date.toLocaleDateString("vi-VN")],
      ["Trạng thái duyệt", "Đã duyệt"],
      ["Trạng thái ghi sổ", "Đã ghi sổ"],
      ["Diễn giải", payment.description || ""],
      ["Ngày tạo", payment.createdAt.toLocaleString("vi-VN")]
    ];

    const filename = `Chi_tiet_phieu_thu_${payment.id}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: payment.projectId,
      reportType: "PAYMENT_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuất chi tiết phiếu thu ${payment.id}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
