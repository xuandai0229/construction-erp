import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getProjectFinancialTrace } from "@/lib/accounting/financialTrace";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    if (!projectId) throw new ApiError(400, "Thiếu projectId để truy vết tài chính công trình.");

    await requireProjectAccess(user, projectId);
    return successResponse(await getProjectFinancialTrace(projectId));
  } catch (error) {
    return handleApiError(error);
  }
}
