import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PeriodClosingEngine } from "@/services/finance/period-closing-engine";
import { requireAccountingAccess, requirePermission, requireProjectAccess } from "@/lib/route-security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { periodId, projectId, action, reason } = body;

    if (!periodId || !projectId || !action) {
      throw new ApiError(400, "Missing required parameters: periodId, projectId, action");
    }
    if (action !== "close" && action !== "reopen") {
      throw new ApiError(400, `Invalid action: ${action}. Only "close" and "reopen" are accepted.`);
    }

    const user = await requirePermission("PERIOD", action === "reopen" ? "UNLOCK" : "LOCK");
    if (!user.companyId) throw new ApiError(400, "User is not assigned to a company.");
    await requireProjectAccess(user, projectId);

    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (action === "close") {
      const result = await PeriodClosingEngine.executePeriodClosing(
        periodId,
        projectId,
        user.id,
        user.companyId
      );
      return successResponse(result);
    }

    if (typeof reason !== "string" || reason.trim().length < 10) {
      throw new ApiError(400, "Reopen requires an explicit audit reason of at least 10 characters.");
    }

    const result = await PeriodClosingEngine.reopenPeriod(
      periodId,
      user.id,
      user.companyId,
      reason.trim(),
      ipAddress,
      userAgent
    );
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    if (!user.companyId) throw new ApiError(400, "User is not assigned to a company.");

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");
    const projectId = searchParams.get("projectId");

    if (!periodId) throw new ApiError(400, "periodId is required");
    if (projectId) await requireProjectAccess(user, projectId);

    const period = await prisma.accountingPeriod.findUnique({
      where: { id: periodId },
      include: {
        fiscalYear: true,
        closedBy: { select: { id: true, name: true, email: true } },
        trialBalanceSnaps: projectId ? {
          where: { projectId },
          orderBy: { accountCode: "asc" },
        } : false,
        profitLossSnaps: projectId ? {
          where: { projectId },
        } : false,
      },
    });

    if (!period) throw new ApiError(404, "Accounting period not found.");
    if (period.fiscalYear.companyId !== user.companyId) {
      throw new ApiError(403, "Access denied: accounting period belongs to another company.");
    }

    return successResponse(period);
  } catch (error) {
    return handleApiError(error);
  }
}
