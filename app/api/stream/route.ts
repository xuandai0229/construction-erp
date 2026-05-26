import { eventBus } from '@/lib/event-bus';
import { handleApiError } from '@/lib/api-error';
import { requireAuth, requireProjectAccess } from '@/lib/route-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (projectId) await requireProjectAccess(user, projectId);

    const stream = new ReadableStream({
    start(controller) {
      const listener = (event: any) => {
        // If projectId is provided, only send events for that project
        if (projectId && event.metadata?.projectId && event.metadata.projectId !== projectId) {
          return;
        }

        const data = JSON.stringify({ type: event.type, id: event.id });
        controller.enqueue(`data: ${data}\n\n`);
      };

      // Subscribe to all events, filtering is done inside the listener
      eventBus.subscribe('*', listener);

      // Keep connection alive
      const interval = setInterval(() => {
        controller.enqueue(': keepalive\n\n');
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        // We can't cleanly unsubscribe without a specific mechanism in event-bus right now
        // But for a simple SSE implementation, this provides the skeleton
        controller.close();
      });
    }
  });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
