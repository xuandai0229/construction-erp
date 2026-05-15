import { handleApiError, successResponse } from "@/lib/api-error";
import { updateCostSchema } from "@/lib/validations";
import { CostService } from "@/services/cost.service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function getServiceOptions() {
  const head = await headers();
  return {
    userId: "system_internal_admin",
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCostSchema.parse(body);
    const options = await getServiceOptions();

    const item = await CostService.update(id, data, options);

    return successResponse(item, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const options = await getServiceOptions();
    await CostService.delete(id, options);
    return successResponse({ deleted: true }, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}
