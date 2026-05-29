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
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      throw new ApiError(400, "Thiếu tham số bắt buộc: fromDate, toDate.");
    }

    const report = await InventoryReportService.getStockRegister({
      companyId: user.companyId,
      warehouseId,
      projectId,
      fromDate,
      toDate,
    });

    const warehouse = warehouseId
      ? await prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : null;

    const headers = [
      "Ma vat tu",
      "Ten vat tu",
      "Don vi tinh",
      "Ton dau ky (SL)",
      "Ton dau ky (Gia tri)",
      "Nhap trong ky (SL)",
      "Nhap trong ky (Gia tri)",
      "Xuat trong ky (SL)",
      "Xuat trong ky (Gia tri)",
      "Ton cuoi ky (SL)",
      "Ton cuoi ky (Gia tri)"
    ];

    const rows = report.map(item => [
      item.materialCode,
      item.materialName,
      item.unit,
      String(item.openingQuantity),
      String(item.openingAmount),
      String(item.inputQuantity),
      String(item.inputAmount),
      String(item.outputQuantity),
      String(item.outputAmount),
      String(item.closingQuantity),
      String(item.closingAmount)
    ]);

    const filename = `NhapXuatTon_${warehouse?.code || "ALL"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: projectId || "",
      reportType: "INVENTORY_REGISTER_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat bao cao nhap xuat ton kho ${warehouse?.name || "ALL"}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
