import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getContractFinancialTrace } from "@/lib/accounting/financialTrace";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId") || "";
    if (!contractId) throw new ApiError(400, "Thiếu contractId để truy vết hợp đồng.");

    const trace = await getContractFinancialTrace(contractId);
    await requireProjectAccess(user, trace.contract.projectId);
    return successResponse(trace);
  } catch (error) {
    return handleApiError(error);
  }
}
