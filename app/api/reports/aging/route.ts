import { handleApiError, successResponse } from "@/lib/api-error";
import { ReportingService } from "@/services/reporting.service";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const type = searchParams.get("type") || "receivable";

    if (projectId) await requireProjectAccess(user, projectId);
    const data = type === "payable" 
      ? await ReportingService.getPayableAging(projectId, user.companyId)
      : await ReportingService.getReceivableAging(projectId, user.companyId);
      
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
