import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireCompanyScope } from "@/lib/route-security";
import { getSupplierFinancialTrace } from "@/lib/accounting/financialTrace";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId") || "";
    if (!supplierId) throw new ApiError(400, "Thiếu supplierId để truy vết nhà cung cấp.");

    const trace = await getSupplierFinancialTrace(supplierId);
    const companyId = trace.supplier.contracts[0]?.projectId
      ? trace.supplier.projects[0]?.project.companyId
      : trace.supplier.projects[0]?.project.companyId;
    await requireCompanyScope(user, companyId);
    return successResponse(trace);
  } catch (error) {
    return handleApiError(error);
  }
}
