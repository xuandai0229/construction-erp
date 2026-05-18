import { NextRequest } from 'next/server';
import { handleApiError, successResponse } from '@/lib/api-error';
import { PythonAnalyticsService } from '@/services/python-analytics.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const action = searchParams.get('action') || 'all';

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await PythonAnalyticsService.runAnalytics(projectId, action);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
