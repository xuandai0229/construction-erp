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
      throw new ApiError(404, "Payment not found");
    }

    await requireProjectAccess(user, payment.projectId);

    const project = await prisma.project.findUnique({
      where: { id: payment.projectId }
    });

    const headers = [
      "Thuoc tinh",
      "Gia tri chi tiet"
    ];

    const rows = [
      ["Ma phieu thanh toan", payment.id],
      ["Du an", project?.name || ""],
      ["Loai thanh toan", "RECEIPT (Phieu thu)"],
      ["Phuong thuc", "BANK_TRANSFER"],
      ["So tien thanh toan", String(payment.amount)],
      ["Ngay thanh toan", payment.date.toISOString().split("T")[0]],
      ["Trang thai duyet", "APPROVED"],
      ["Trang thai ghi so", "POSTED"],
      ["Dien giai", payment.description || ""],
      ["Ngay tao", payment.createdAt.toISOString()]
    ];

    const filename = `ChiTietPhieu_Thu_${payment.id}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: payment.projectId,
      reportType: "PAYMENT_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat chi tiet phieu Thu ${payment.id}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
