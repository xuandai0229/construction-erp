import { handleApiError, ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/route-security";
import { InventoryReportService } from "@/services/inventory-report.service";
import { generateCsvResponse } from "@/lib/export/accountingExport";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requirePermission("DOCUMENT", "READ");
    if (!user.companyId) {
      throw new ApiError(403, "Người dùng không có context công ty");
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new ApiError(400, "Thiếu tham số bắt buộc: projectId");
    }

    const report = await InventoryReportService.getProjectInventoryBalance(
      user.companyId,
      projectId
    );

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    const headers = [
      "Ma kho",
      "Ten kho",
      "Ma vat tu",
      "Ten vat tu",
      "Don vi tinh",
      "So luong ton",
      "Don gia binh quan",
      "Tong gia tri ton"
    ];

    const rows = report.map(item => [
      item.warehouseCode,
      item.warehouseName,
      item.materialCode,
      item.materialName,
      item.unit,
      String(item.quantity),
      String(item.avgCost),
      String(item.totalCost)
    ]);

    const filename = `TonKhoDuAn_${project?.name || "DuAn"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType: "INVENTORY_PROJECT_STOCK_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat bao cao ton kho cho du an ${project?.name}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
