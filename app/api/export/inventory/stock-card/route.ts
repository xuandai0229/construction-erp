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
    const warehouseId = searchParams.get("warehouseId");
    const materialItemId = searchParams.get("materialItemId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const projectId = searchParams.get("projectId") || undefined;
    const wbsId = searchParams.get("wbsId") || undefined;

    if (!warehouseId || !materialItemId || !fromDate || !toDate) {
      throw new ApiError(400, "Thiếu tham số bắt buộc: warehouseId, materialItemId, fromDate, toDate.");
    }

    const report = await InventoryReportService.getStockCard({
      companyId: user.companyId,
      warehouseId,
      materialItemId,
      projectId,
      wbsId,
      fromDate,
      toDate,
    });

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    const material = await prisma.materialItem.findUnique({ where: { id: materialItemId } });

    const headers = [
      "Ngày di chuyển",
      "Loại chứng từ",
      "Số chứng từ",
      "Diễn giải",
      "Số lượng nhập",
      "Giá trị nhập",
      "Số lượng xuất",
      "Giá trị xuất",
      "Số lượng tồn",
      "Đơn giá bình quân lũy kế"
    ];

    const rows = [
      // Opening row
      [
        new Date(fromDate).toLocaleDateString("vi-VN"),
        "Dư đầu kỳ",
        "-",
        "Số dư đầu kỳ",
        "0",
        "0",
        "0",
        "0",
        String(report.openingQuantity),
        String(report.openingAvgCost)
      ],
      // Period rows
      ...report.lines.map(line => [
        new Date(line.movementDate).toLocaleDateString("vi-VN"),
        line.documentType,
        line.documentNo,
        line.description,
        String(line.inputQuantity),
        String(line.inputAmount),
        String(line.outputQuantity),
        String(line.outputAmount),
        String(line.runningQuantity),
        String(line.runningAvgCost)
      ])
    ];

    const filename = `The_kho_${warehouse?.code || "Kho"}_${material?.code || "Vat_tu"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId: projectId || "",
      reportType: "INVENTORY_STOCK_CARD_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuất thẻ kho vật tư ${material?.name || materialItemId} tại kho ${warehouse?.name || warehouseId}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
