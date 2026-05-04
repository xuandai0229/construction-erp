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
      project_id: c.project_id,
      wbs_id: c.wbs_id,
      wbs_name: c.wbs.name,
      cost_type: c.cost_type,
      amount: c.amount,
      quantity: c.quantity,
      unit_price: c.unit_price,
      supplier: c.supplier,
      note: c.note,
      date: c.date.toISOString(),
      status: c.status,
      created_at: c.createdAt.toISOString(),
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
      project_id: item.project_id,
      wbs_id: item.wbs_id,
      cost_type: item.cost_type,
      amount: item.amount,
      quantity: item.quantity,
      unit_price: item.unit_price,
      supplier: item.supplier,
      note: item.note,
      date: item.date.toISOString(),
      status: item.status,
      created_at: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
