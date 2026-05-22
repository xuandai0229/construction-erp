import { prisma } from "@/lib/prisma";
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

import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id") || undefined;
    
    const body = await request.json();
    const data = createWBSSchema.parse(body);

    const item = await WBSService.create(data, userId);
    return successResponse(item, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
