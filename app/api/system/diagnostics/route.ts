
import { handleApiError, successResponse } from "@/lib/api-error";
import { DiagnosticsService } from "@/services/diagnostics.service";
import { auditSecurityAccess, requireAdmin, requireProjectAccess } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      await requireProjectAccess(user, projectId);
      await auditSecurityAccess({
        userId: user.id,
        entity: "SystemDiagnostics",
        entityId: projectId,
        reason: "Project reconciliation diagnostics accessed.",
        severity: "WARNING",
      });
      // Reconciliation for specific project
      const results = await DiagnosticsService.reconcileProject(projectId);
      return successResponse({
        type: "RECONCILIATION",
        projectId,
        ...results
      });
    }

    await auditSecurityAccess({
      userId: user.id,
      entity: "SystemDiagnostics",
      entityId: user.companyId || "GLOBAL",
      reason: "Global system diagnostics accessed.",
      severity: "WARNING",
    });

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
