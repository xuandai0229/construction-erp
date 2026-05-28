import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { LedgerReportService } from "@/services/finance/ledger-report.service";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const accountCode = searchParams.get("accountCode");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (!projectId) {
      throw new ApiError(400, "Vui lòng chọn Dự án");
    }

    if (!accountCode) {
      throw new ApiError(400, "Vui lòng chọn Tài khoản kế toán");
    }

    // Cô lập Tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new ApiError(404, "Không tìm thấy dự án.");
    }

    await requireProjectAccess(user, projectId);

    const report = await LedgerReportService.getReport(projectId, accountCode, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    return handleApiError(error);
  }
}
