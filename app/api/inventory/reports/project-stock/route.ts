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
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new ApiError(400, "Thiếu tham số bắt buộc: projectId");
    }

    const report = await InventoryReportService.getProjectInventoryBalance(
      user.companyId,
      projectId
    );

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return handleApiError(error);
  }
}
