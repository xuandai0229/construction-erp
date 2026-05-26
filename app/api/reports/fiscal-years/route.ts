import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/auth-guard";

/**
 * GET: List fiscal years + periods for the user's company
 * POST: Create a fiscal year with auto-generated 12 monthly periods
 */
export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (!user.companyId) throw new ApiError(400, "Tài khoản chưa được gán doanh nghiệp.");

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: { companyId: user.companyId },
      include: {
        periods: {
          orderBy: { periodNumber: "asc" },
          select: {
            id: true,
            periodNumber: true,
            month: true,
            startDate: true,
            endDate: true,
            status: true,
            closedAt: true,
            closedById: true
          }
        },
        closedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { year: "desc" }
    });

    return successResponse(fiscalYears);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (!user.companyId) throw new ApiError(400, "Tài khoản chưa được gán doanh nghiệp.");

    // Only ADMIN and DIRECTOR can create fiscal years
    if (!["ADMIN", "DIRECTOR"].includes(user.role)) {
      throw new ApiError(403, "Chỉ Quản trị viên hoặc Giám đốc mới có quyền tạo năm tài chính.");
    }

    const body = await request.json();
    const { year } = body;

    if (!year || typeof year !== "number" || year < 2020 || year > 2100) {
      throw new ApiError(400, "Năm tài chính phải là số từ 2020 đến 2100.");
    }

    // Check duplicate
    const existing = await prisma.fiscalYear.findUnique({
      where: { companyId_year: { companyId: user.companyId, year } }
    });
    if (existing) {
      throw new ApiError(409, `Năm tài chính ${year} đã tồn tại cho doanh nghiệp.`);
    }

    // Create fiscal year + 12 monthly periods in a transaction
    const fiscalYear = await prisma.$transaction(async (tx) => {
      const fy = await tx.fiscalYear.create({
        data: {
          companyId: user.companyId!,
          year,
          startDate: new Date(`${year}-01-01T00:00:00Z`),
          endDate: new Date(`${year}-12-31T23:59:59Z`),
          status: "OPEN"
        }
      });

      // Generate 12 accounting periods
      const periods = [];
      for (let m = 1; m <= 12; m++) {
        const monthStr = String(m).padStart(2, '0');
        const startDate = new Date(`${year}-${monthStr}-01T00:00:00Z`);
        // Last day of the month
        const endDate = new Date(year, m, 0, 23, 59, 59);

        periods.push({
          fiscalYearId: fy.id,
          periodNumber: m,
          month: `${year}-${monthStr}`,
          startDate,
          endDate,
          status: "OPEN" as const
        });
      }

      await tx.accountingPeriod.createMany({ data: periods });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "FISCAL_YEAR_CREATE",
          entity: "FiscalYear",
          entityId: fy.id,
          severity: "INFO",
          newData: { year, companyId: user.companyId, periodsCreated: 12 }
        }
      });

      return fy;
    });

    // Re-fetch with periods
    const result = await prisma.fiscalYear.findUnique({
      where: { id: fiscalYear.id },
      include: {
        periods: { orderBy: { periodNumber: "asc" } }
      }
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
