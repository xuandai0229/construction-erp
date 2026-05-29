import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ManagementReportService, ReportFilters } from "@/services/management-report.service";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAccountingAccess("READ");
    
    if (!user.companyId) {
      throw new Error("Người dùng chưa được gán Công ty (Tenant isolation)");
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    const filters: ReportFilters = {
      companyId: user.companyId,
      projectId
    };

    const data = await ManagementReportService.getProjectProfitability(filters);
    
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
