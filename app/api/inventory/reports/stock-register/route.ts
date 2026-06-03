import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError, ApiError } from "@/lib/api-error";
import { InventoryReportService } from "@/services/inventory-report.service";

export async function GET(request: Request) {
  try {
    const user = await requirePermission("DOCUMENT", "READ");
    if (!user.companyId) {
      if (user.role === "SUPER_ADMIN") {
        return NextResponse.json({
          success: true,
          data: [],
          metadata: {
            warning: "Tài khoản SUPER_ADMIN chưa được gán công ty; chưa có dữ liệu báo cáo kho để hiển thị."
          }
        });
      }
      throw new ApiError(403, "Bạn không có quyền xem dữ liệu kho vật tư. Vui lòng liên hệ quản trị hệ thống nếu cần truy cập.");
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
