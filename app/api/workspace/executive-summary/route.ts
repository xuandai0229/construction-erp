
import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    
    const summary = await DashboardService.getExecutiveKPIs(projectId);
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
