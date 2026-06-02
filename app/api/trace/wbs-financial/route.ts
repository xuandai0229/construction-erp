import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getWbsFinancialTrace } from "@/lib/accounting/financialTrace";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const wbsItemId = searchParams.get("wbsItemId") || "";
    if (!wbsItemId) throw new ApiError(400, "Thiếu wbsItemId để truy vết hạng mục WBS.");

    const trace = await getWbsFinancialTrace(wbsItemId);
    await requireProjectAccess(user, trace.wbs.projectId);
    return successResponse(trace);
  } catch (error) {
    return handleApiError(error);
  }
}
