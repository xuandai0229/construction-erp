import { requireAccountingAccess } from "@/lib/route-security";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { ManagementReportService, ReportFilters } from "@/services/management-report.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    
    // Require company context
    if (!user.companyId) {
      if (user.role !== "SUPER_ADMIN") {
        throw new ApiError(403, "Tài khoản chưa được gán công ty/pháp nhân để xem báo cáo quản trị.");
      }

      return successResponse({
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: user.id,
          filters: { companyId: null, projectId: undefined },
          source: "LEDGER_AND_SUBLEDGERS",
          warning: "Tài khoản SUPER_ADMIN chưa gắn công ty; trả dữ liệu trống để tránh hiểu nhầm số liệu."
        },
        revenue: 0,
        cost: 0,
        profit: 0,
        receivables: 0,
        payables: 0,
        outstandingAdvances: 0,
        cashIn: 0,
        cashOut: 0,
        netCashflow: 0,
        pendingApprovals: 0,
        riskAlerts: 0
      });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;

    const filters: ReportFilters = {
      companyId: user.companyId,
      projectId,
      dateFrom,
      dateTo
    };

    const data = await ManagementReportService.getExecutiveSummary(filters);
    
    return successResponse({
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        filters,
        source: "LEDGER_AND_SUBLEDGERS"
      },
      ...data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
