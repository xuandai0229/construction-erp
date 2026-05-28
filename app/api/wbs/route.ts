import { handleApiError, successResponse } from "@/lib/api-error";
import { createWBSSchema } from "@/lib/validations";
import { WBSService } from "@/services/wbs.service";
import { requireProjectPermission } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (!projectId) {
      return successResponse({ tree: [], flat: [], stats: {} });
    }

    await requireProjectPermission(projectId, "PROJECT", "READ");
    const result = await WBSService.findByProject(projectId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createWBSSchema.parse(body);
    const user = await requireProjectPermission(data.projectId, "PROJECT", "UPDATE");

    const item = await WBSService.create(data, user.id);
    return successResponse(item, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
