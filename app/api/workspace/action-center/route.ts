
import { NextRequest, NextResponse } from 'next/server';
import { ActionCenterService } from '@/services/action-center.service';
import { handleApiError } from '@/lib/api-error';
import { assertAuthenticated } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
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

    const tasks = await ActionCenterService.getUserTasks(user.id, projectId);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
