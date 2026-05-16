import { handleApiError, successResponse } from "@/lib/api-error";
import { ReconciliationService } from "@/services/reconciliation.service";

export async function GET() {
  try {
    const data = await ReconciliationService.runGlobalReconciliation();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
