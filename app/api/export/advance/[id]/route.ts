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

    const advance = await prisma.advanceRequest.findUnique({
      where: { id },
      include: { project: true, employee: true }
    });

    if (!advance) {
      throw new ApiError(404, "Advance request not found");
    }

    if (advance.projectId) {
      await requireProjectAccess(user, advance.projectId);
    }

    const headers = [
      "Thuoc tinh",
      "Gia tri chi tiet"
    ];

    const rows = [
      ["Ma phieu tam ung", advance.advanceNo || advance.id],
      ["Du an", advance.project?.name || ""],
      ["Nhan vien de nghi", advance.employee?.name || ""],
      ["So tien de nghi tam ung", String(advance.amount)],
      ["So tien con lai chua quyet toan", String(advance.remainingAmount)],
      ["Ngay lap phieu", advance.createdAt.toISOString().split("T")[0]],
      ["Trang thai phieu", advance.status],
      ["Dien giai ly do", advance.purpose || ""]
    ];

    const filename = `ChiTietDeNghiTamUng_${advance.advanceNo || advance.id}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: advance.projectId || undefined,
      reportType: "ADVANCE_DETAIL_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat chi tiet phieu de nghi tam ung ${advance.advanceNo || advance.id}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
