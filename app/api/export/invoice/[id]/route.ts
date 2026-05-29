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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { wbs: true }
    });

    if (!invoice || invoice.deletedAt) {
      throw new ApiError(404, "Invoice not found");
    }

    await requireProjectAccess(user, invoice.projectId);

    const project = await prisma.project.findUnique({
      where: { id: invoice.projectId }
    });

    const headers = [
      "Thuoc tinh",
      "Gia tri chi tiet"
    ];

    const rows = [
      ["Ma hoa don", invoice.invoiceNumber || invoice.id],
      ["Du an", project?.name || ""],
      ["Hang muc WBS", invoice.wbs?.name || ""],
      ["Ngay phat hanh", invoice.issuedDate.toISOString().split("T")[0]],
      ["Ngay dao han", invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : "—"],
      ["Gia tri truoc thue", String(Number(invoice.amount) - Number(invoice.vatAmount))],
      ["Thue suat VAT (%)", String(invoice.vatRate)],
      ["Tien thue VAT", String(invoice.vatAmount)],
      ["Tong gia tri hoa don", String(invoice.amount)],
      ["Da thanh toan", String(invoice.paidAmount)],
      ["Con lai phai thu", String(invoice.remainingAmount)],
      ["Trang thai duyet", invoice.approvalStatus],
      ["Trang thai thanh toan", invoice.status],
      ["Ngay tao", invoice.createdAt.toISOString()]
    ];

    const filename = `ChiTietHoaDon_${invoice.invoiceNumber || invoice.id}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: invoice.projectId,
      reportType: "INVOICE_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat chi tiet hoa don ${invoice.invoiceNumber || invoice.id}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
