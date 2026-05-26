
import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { handleApiError } from '@/lib/api-error';
import { requireAuth } from '@/lib/route-security';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const unread = await NotificationService.getUnread(userId);
    return NextResponse.json({ success: true, data: unread });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { action, id } = await request.json();
    const user = await requireAuth();
    const userId = user.id;

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
