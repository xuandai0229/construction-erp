import { prisma } from "@/lib/prisma";
import { handleApiError, successResponse } from "@/lib/api-error";
import { createWBSSchema } from "@/lib/validations";
import { WBSService } from "@/services/wbs.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return successResponse([]);
    }

    const result = await WBSService.findByProject(projectId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Submitting WBS:", body);
    const data = createWBSSchema.parse(body);

    const item = await WBSService.create(data);
    return successResponse(item, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
