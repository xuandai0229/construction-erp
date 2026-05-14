
import { handleApiError, successResponse } from "@/lib/api-error";
import { DiagnosticsService } from "@/services/diagnostics.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Reconciliation for specific project
      const results = await DiagnosticsService.reconcileProject(projectId);
      return successResponse({
        type: "RECONCILIATION",
        projectId,
        ...results
      });
    }

    // Global health check
    const health = await DiagnosticsService.systemHealthCheck();
    return successResponse({
      type: "SYSTEM_HEALTH",
      ...health
    });
  } catch (error) {
    return handleApiError(error);
  }
}
