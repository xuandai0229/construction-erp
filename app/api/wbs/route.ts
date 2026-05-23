import { handleApiError, successResponse } from "@/lib/api-error";
import { createWBSSchema } from "@/lib/validations";
import { WBSService } from "@/services/wbs.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");

    if (!projectId) {
      return successResponse({ tree: [], flat: [], stats: {} });
    }

    const result = await WBSService.findByProject(projectId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

import { cookies } from "next/headers";
import { SessionManager } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("erp-session")?.value;
    const session = SessionManager.verifySession(token || null);
    const userId = session?.userId;
    
    if (!userId) {
      return handleApiError(new Error("Authentication required"));
    }
    
    const body = await request.json();
    const data = createWBSSchema.parse(body);

    const item = await WBSService.create(data, userId);
    return successResponse(item, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
