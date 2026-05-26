import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/auth-guard";

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    const body = await request.json();
    const { reportType, projectId } = body;

    if (!reportType || !projectId) {
      throw new ApiError(400, "Missing required parameters: reportType, projectId");
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const audit = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXPORT_REPORT",
        entity: reportType,
        entityId: projectId,
        ipAddress,
        userAgent,
        newData: {
          reportType,
          projectId,
          exportedAt: new Date().toISOString()
        },
        severity: "WARNING" // Warning because it is a data export operation
      }
    });

    return successResponse({ success: true, logId: audit.id });

  } catch (error) {
    return handleApiError(error);
  }
}
