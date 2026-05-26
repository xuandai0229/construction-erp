import { NextRequest } from 'next/server';
import { handleApiError, successResponse } from '@/lib/api-error';
import { PythonAnalyticsService } from '@/services/python-analytics.service';
import { requireProjectAccess, requireProjectPermission } from '@/lib/route-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, query } = body;

    if (!projectId || !query) {
      return new Response(JSON.stringify({ error: 'Missing projectId or query in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await requireProjectPermission(projectId, "PROJECT", "READ");
    await requireProjectAccess(user, projectId);
    const data = await PythonAnalyticsService.runAnalytics(projectId, 'chat', query);
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
