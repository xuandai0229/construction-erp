import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const type = searchParams.get("type") || "receivable";

    const data = type === "payable" 
      ? await ReportingService.getPayableAging(projectId)
      : await ReportingService.getReceivableAging(projectId);
      
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
