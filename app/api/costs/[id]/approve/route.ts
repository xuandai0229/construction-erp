import { CostService } from '@/services/cost.service';
import { handleApiError, successResponse } from '@/lib/api-error';
import { assertIsManager } from '@/lib/auth-guard';
import { headers } from "next/headers";

async function getServiceOptions() {
  const head = await headers();
  return {
    userId: head.get("x-user-id") || undefined,
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json(); // nextStatus
    const options = await getServiceOptions();

    // Security Guard: Only Managers/Admins can approve
    await assertIsManager(options.userId);
    
    const result = await CostService.transition(id, status, options);
    return successResponse(result, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}
