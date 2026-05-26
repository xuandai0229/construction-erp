import { handleApiError, successResponse } from "@/lib/api-error";
import { ProcurementService } from "@/services/procurement.service";
import { requireProjectPermission } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return successResponse([]);

    await requireProjectPermission(projectId, "COST", "READ");
    const items = await ProcurementService.findPOsByProject(projectId);
    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await requireProjectPermission(body.projectId, "COST", "CREATE");
    body.createdById = user.id;
    const item = await ProcurementService.createPO(body);
    return successResponse(item, "PO created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
