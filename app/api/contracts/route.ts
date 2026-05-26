import { handleApiError, successResponse } from "@/lib/api-error";
import { ContractService } from "@/services/contract.service";
import { requireProjectAccess, requireProjectPermission } from "@/lib/route-security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return successResponse([]);

    await requireProjectPermission(projectId, "PROJECT", "READ");
    const items = await ContractService.findByProject(projectId);
    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await requireProjectPermission(body.projectId, "PROJECT", "UPDATE");
    await requireProjectAccess(user, body.projectId);
    const item = await ContractService.createContract(body);
    return successResponse(item, "Contract created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
