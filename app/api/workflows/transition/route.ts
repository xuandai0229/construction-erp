import { handleApiError, successResponse } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { WorkflowEngine, WorkflowType } from "@/services/workflow/workflow.engine";
import { MetricsCollector } from "@/lib/metrics";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const user = await assertAuthenticated();

    const body = await request.json();
    const { type, entityId, toState, reason } = body;

    if (!type || !entityId || !toState) {
      throw new Error("Missing workflow parameters: 'type', 'entityId', or 'toState'.");
    }

    const updated = await WorkflowEngine.transition(
      type as WorkflowType,
      entityId,
      toState,
      {
        userId: user.id,
        companyId: user.companyId || "system_default",
        role: user.role,
        reason,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined
      }
    );

    const elapsed = Date.now() - startTime;
    MetricsCollector.recordWorkflowTransition(elapsed);

    return successResponse(updated, `Workflow ${type} transitioned successfully to ${toState}`);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    MetricsCollector.recordWorkflowTransition(elapsed);
    return handleApiError(error);
  }
}
