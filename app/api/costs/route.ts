import { handleApiError, successResponse } from "@/lib/api-error";
import { createCostSchema } from "@/lib/validations";
import { CostService } from "@/services/cost.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    
    if (!projectId) return successResponse([]);

    const filters = {
      costType: searchParams.get("costType") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const items = await CostService.findByProject(projectId, filters);

    // Map to frontend shape (snake_case)
    const mapped = items.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      wbsId: c.wbsId,
      wbsName: c.wbs.name,
      costType: c.costType,
      amount: c.amount,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      supplier: c.supplier,
      note: c.note,
      date: c.date.toISOString(),
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createCostSchema.parse(body);

    const item = await CostService.create(data);

    return successResponse({
      id: item.id,
      projectId: item.projectId,
      wbsId: item.wbsId,
      costType: item.costType,
      amount: item.amount,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
      note: item.note,
      date: item.date.toISOString(),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


