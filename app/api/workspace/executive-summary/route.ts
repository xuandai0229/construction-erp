
import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { handleApiError } from '@/lib/api-error';
import { assertAuthenticated } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    
    if (projectId && user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const summary = await DashboardService.getExecutiveKPIs(projectId, user.companyId, user.id);
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
