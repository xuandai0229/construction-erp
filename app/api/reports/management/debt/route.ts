import { requireAccountingAccess } from "@/lib/route-security";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { ManagementReportService, ReportFilters } from "@/services/management-report.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    
    if (!user.companyId) {
      if (user.role !== "SUPER_ADMIN") {
        throw new ApiError(403, "Tài khoản chưa được gán công ty/pháp nhân để xem công nợ quản trị.");
      }

      return successResponse({
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: user.id,
          filters: { companyId: null },
          source: "LEDGER_AND_SUBLEDGERS",
          warning: "Tài khoản SUPER_ADMIN chưa gắn công ty; trả dữ liệu công nợ trống."
        },
        arTotal: 0,
        apTotal: 0,
        agingBuckets: { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 },
        overdueInvoices: []
      });
    }

    const { searchParams } = new URL(request.url);
    const filters: ReportFilters = {
      companyId: user.companyId,
      projectId: searchParams.get("projectId") || undefined
    };

    const data = await ManagementReportService.getDebtManagement(filters);
    
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
