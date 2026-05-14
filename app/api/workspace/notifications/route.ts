
import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const userId = "system_internal_admin";
    const unread = await NotificationService.getUnread(userId);
    return NextResponse.json({ success: true, data: unread });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { action, id } = await request.json();
    const userId = "system_internal_admin";

    if (action === 'READ_ALL') {
      await NotificationService.markAllAsRead(userId);
    } else if (action === 'READ' && id) {
      await NotificationService.markAsRead(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
