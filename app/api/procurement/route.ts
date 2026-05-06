import { handleApiError, successResponse } from "@/lib/api-error";
import { ProcurementService } from "@/services/procurement.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return successResponse([]);

    const items = await ProcurementService.findPOsByProject(projectId);
    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await ProcurementService.createPO(body);
    return successResponse(item, "PO created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
