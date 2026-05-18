
import { NextRequest, NextResponse } from 'next/server';
import { ActionCenterService } from '@/services/action-center.service';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const userId = "system_internal_admin"; // Internal Admin Mode
    const tasks = await ActionCenterService.getUserTasks(userId, projectId);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
