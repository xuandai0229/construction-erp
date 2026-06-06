import { requireAccountingAccess } from "@/lib/route-security";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { ManagementReportService, ReportFilters } from "@/services/management-report.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    
    if (!user.companyId) {
      if (user.role !== "SUPER_ADMIN") {
        throw new ApiError(403, "Tài khoản chưa được gán công ty/pháp nhân để xem cảnh báo rủi ro.");
      }

      return successResponse({
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: user.id,
          filters: { companyId: null },
          source: "LEDGER_AND_SUBLEDGERS",
          warning: "Tài khoản SUPER_ADMIN chưa gắn công ty; trả danh sách cảnh báo trống."
        },
        data: []
      });
    }

    const { searchParams } = new URL(request.url);
    const filters: ReportFilters = {
      companyId: user.companyId,
      projectId: searchParams.get("projectId") || undefined
    };

    const data = await ManagementReportService.getRiskAlerts(filters);
    
    return successResponse({
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        filters,
        source: "LEDGER_AND_SUBLEDGERS"
      },
      data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
