import { NextRequest } from 'next/server';
import { handleApiError, successResponse, ApiError } from '@/lib/api-error';
import { PythonAnalyticsService } from '@/services/python-analytics.service';
import { assertAuthenticated } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await assertAuthenticated();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const action = searchParams.get('action') || 'all';

    if (!projectId) {
      throw new ApiError(400, 'Missing projectId parameter');
    }

    // Tenant Isolation & Project Ownership Validation
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (user.companyId && project.companyId !== user.companyId) {
      throw new ApiError(403, 'Cross-tenant access denied');
    }

    const data = await PythonAnalyticsService.runAnalytics(projectId, action);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
