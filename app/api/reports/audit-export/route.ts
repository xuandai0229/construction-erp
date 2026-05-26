import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { auditExportOrThrow, requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");
    const body = await request.json();
    const { reportType, projectId } = body;

    if (!reportType || !projectId) {
      throw new ApiError(400, "Missing required parameters: reportType, projectId");
    }

    await requireProjectAccess(user, projectId);
    const audit = await auditExportOrThrow({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType,
      format: String(body.format || "client_export"),
      reason: body.reason
    });

    return successResponse({ success: true, logId: audit.id });

  } catch (error) {
    return handleApiError(error);
  }
}
