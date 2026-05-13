import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";

export async function GET() {
  try {
    const stats = await ProjectService.getGlobalStats();
    return successResponse(stats);
  } catch (error) {
    console.error('[STATS_GET_ERROR]', error);
    return handleApiError(error);
  }
}
