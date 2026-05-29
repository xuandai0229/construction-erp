import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError, ApiError } from "@/lib/api-error";
import { InventoryReportService } from "@/services/inventory-report.service";

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

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return handleApiError(error);
  }
}
