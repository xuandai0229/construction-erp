
import { NextResponse } from 'next/server';
import { FinancialAggregationService } from '@/services/financial-aggregation.service';
import { handleApiError } from '@/lib/api-error';
import { assertAuthenticated } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'ProjectId is required' }, { status: 400 });
    }

    if (user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const intelligence = await FinancialAggregationService.getIntelligenceSnapshot(projectId);
    return NextResponse.json({ success: true, data: intelligence });
  } catch (error) {
    return handleApiError(error);
  }
}
