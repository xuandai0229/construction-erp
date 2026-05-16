import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { FinancialAggregationService } from "@/services/financial-aggregation.service";

export async function GET() {
  try {
    const lockedMonths = await FinancialAggregationService.getLockedMonths();
    return successResponse(lockedMonths);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { month } = await request.json();
    
    if (!month) {
      throw new ApiError(400, "Month is required");
    }

    // In stabilization mode, we use a placeholder or system user
    const result = await FinancialAggregationService.toggleFiscalPeriod(month, "system-admin");
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
