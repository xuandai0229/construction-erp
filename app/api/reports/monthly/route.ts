import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    
    if (!projectId) {
      return successResponse([]);
    }

    await requireProjectAccess(user, projectId);
    const data = await ReportingService.getProjectMonthlyReport(projectId);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
