import { handleApiError, successResponse } from "@/lib/api-error";
import { createCostSchema } from "@/lib/validations";
import { CostService } from "@/services/cost.service";
import { headers } from "next/headers";

async function getServiceOptions() {
  const head = await headers();
  return {
    userId: head.get("x-user-id") || "system_internal_admin",
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

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

    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createCostSchema.parse(body);
    const options = await getServiceOptions();

    const item = await CostService.create(data, options);

    return successResponse(item, { correlationId: options.correlationId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


