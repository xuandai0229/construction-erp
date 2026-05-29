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
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      throw new ApiError(400, "Thiếu tham số ngày bắt đầu (fromDate) hoặc ngày kết thúc (toDate).");
    }

    const report = await InventoryReportService.getStockRegister({
      companyId: user.companyId,
      warehouseId,
      projectId,
      fromDate,
      toDate,
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return handleApiError(error);
  }
}
