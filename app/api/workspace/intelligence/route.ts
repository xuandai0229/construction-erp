
import { NextResponse } from 'next/server';
import { FinancialAggregationService } from '@/services/financial-aggregation.service';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'ProjectId is required' }, { status: 400 });
    }

    const intelligence = await FinancialAggregationService.getIntelligenceSnapshot(projectId);
    return NextResponse.json({ success: true, data: intelligence });
  } catch (error) {
    return handleApiError(error);
  }
}
