import { AuditService } from '@/services/audit.service';
import { ApiError, handleApiError, successResponse } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');

    if (!entity || !entityId) {
      throw new ApiError(400, 'Missing entity or entityId');
    }

    const logs = await AuditService.getHistory(entity, entityId);
    return successResponse(logs);
  } catch (error: any) {
    return handleApiError(error);
  }
}
