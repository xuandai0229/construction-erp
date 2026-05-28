import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/api-error";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { WorkInProgressClosingService } from "@/services/finance/wip-closing.service";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!projectId || !startDate || !endDate) {
      throw new ApiError(400, "Vui lòng truyền đầy đủ projectId, startDate, endDate");
    }

    // Cô lập Tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new ApiError(404, "Không tìm thấy dự án.");
    }

    await requireProjectAccess(user, projectId);

    const report = await WorkInProgressClosingService.previewClosing(projectId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("CREATE");

    const body = await request.json();
    const { projectId, startDate, endDate } = body;

    if (!projectId || !startDate || !endDate) {
      throw new ApiError(400, "Vui lòng truyền đầy đủ projectId, startDate, endDate trong body");
    }

    // Cô lập Tenant
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new ApiError(404, "Không tìm thấy dự án.");
    }

    await requireProjectAccess(user, projectId);

    const result = await WorkInProgressClosingService.executeClosing(user.id, projectId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error);
  }
}
