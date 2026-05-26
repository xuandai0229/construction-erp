import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";
import { auditSecurityAccess, requireAccountingAccess, requirePermission } from "@/lib/route-security";

export async function GET() {
  try {
    await requireAccountingAccess("READ");
    const lockedMonths = await FinancialAggregationService.getLockedMonths();
    return successResponse(lockedMonths);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("PERIOD", "LOCK");
    const { month } = await request.json();
    
    if (!month) {
      throw new ApiError(400, "Month is required");
    }

    await auditSecurityAccess({
      userId: user.id,
      entity: "FiscalPeriod",
      entityId: month,
      reason: "Legacy fiscal period toggle requested.",
      severity: "WARNING",
    });
    const result = await FinancialAggregationService.toggleFiscalPeriod(month, user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
