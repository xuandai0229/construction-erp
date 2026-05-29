import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ManagementReportService, ReportFilters } from "@/services/management-report.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    
    // Require company context
    if (!user.companyId) {
      throw new Error("Người dùng chưa được gán Công ty (Tenant isolation)");
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
