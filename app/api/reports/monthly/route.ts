import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    
    if (!projectId) {
      return successResponse([]);
    }

    const data = await ReportingService.getProjectMonthlyReport(projectId);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
