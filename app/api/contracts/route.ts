import { handleApiError, successResponse } from "@/lib/api-error";
import { ContractService } from "@/services/contract.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return successResponse([]);

    const items = await ContractService.findByProject(projectId);
    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await ContractService.createContract(body);
    return successResponse(item, "Contract created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
