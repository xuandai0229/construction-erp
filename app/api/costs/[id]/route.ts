import { handleApiError, successResponse } from "@/lib/api-error";
import { CostService } from "@/services/cost.service";
import { CostType, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const updateCostSchema = z.object({
  wbsId: z.string().uuid().optional(),
  costType: z.nativeEnum(CostType).optional(),
  amount: z.number().positive().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  supplier: z.string().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
});

import { getUserContext } from "@/lib/auth-context";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserContext(request);
    const body = await request.json();
    
    const data = {
      ...updateCostSchema.omit({ amount: true, status: true }).parse(body),
      userId: user.id,
      userRole: user.role
    };

    const item = await CostService.update(id, data);
    return successResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserContext(request);
    await CostService.delete(id, user.id, user.role);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
