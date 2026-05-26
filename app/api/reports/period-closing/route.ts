import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/auth-guard";
import { PeriodClosingEngine } from "@/services/finance/period-closing-engine";

/**
 * POST: Close or reopen an accounting period
 * Body: { periodId, projectId, action: "close" | "reopen", reason?: string }
 */
export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (!user.companyId) throw new ApiError(400, "Tài khoản chưa được gán doanh nghiệp.");

    // Only ADMIN and DIRECTOR can manage period closing
    if (!["ADMIN", "DIRECTOR"].includes(user.role)) {
      throw new ApiError(403, "Chỉ Quản trị viên hoặc Giám đốc/CFO mới có quyền khóa/mở sổ kỳ kế toán.");
    }

    const body = await request.json();
    const { periodId, projectId, action, reason } = body;

    if (!periodId || !projectId || !action) {
      throw new ApiError(400, "Missing required parameters: periodId, projectId, action");
    }

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

    } else if (action === "reopen") {
      if (!reason) {
        throw new ApiError(400, "Lý do mở lại kỳ kế toán là bắt buộc khi thực hiện REOPEN.");
      }
      const result = await PeriodClosingEngine.reopenPeriod(
        periodId,
        user.id,
        user.companyId,
        reason,
        ipAddress,
        userAgent
      );
      return successResponse(result);

    } else {
      throw new ApiError(400, `Action không hợp lệ: ${action}. Chỉ chấp nhận "close" hoặc "reopen".`);
    }

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET: Get period details with snapshot summary
 */
export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (!user.companyId) throw new ApiError(400, "Tài khoản chưa được gán doanh nghiệp.");

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");
    const projectId = searchParams.get("projectId");

    if (!periodId) throw new ApiError(400, "periodId is required");

    const period = await prisma.accountingPeriod.findUnique({
      where: { id: periodId },
      include: {
        fiscalYear: true,
        closedBy: { select: { id: true, name: true, email: true } },
        trialBalanceSnaps: projectId ? {
          where: { projectId },
          orderBy: { accountCode: "asc" }
        } : false,
        profitLossSnaps: projectId ? {
          where: { projectId }
        } : false
      }
    });

    if (!period) throw new ApiError(404, "Kỳ kế toán không tồn tại.");
    if (period.fiscalYear.companyId !== user.companyId) {
      throw new ApiError(403, "Không có quyền truy cập kỳ kế toán của doanh nghiệp khác.");
    }

    return successResponse(period);
  } catch (error) {
    return handleApiError(error);
  }
}
