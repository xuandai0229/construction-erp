import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getSourceDocumentTrace } from "@/lib/accounting/financialTrace";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType") || "";
    const sourceId = searchParams.get("sourceId") || "";

    if (!sourceType || !sourceId) {
      throw new ApiError(400, "Thiếu sourceType hoặc sourceId để truy vết chứng từ.");
    }

    const trace = await getSourceDocumentTrace(sourceType, sourceId);
    if (trace.project?.id) {
      await requireProjectAccess(user, trace.project.id);
    }

    return successResponse(trace);
  } catch (error) {
    return handleApiError(error);
  }
}
