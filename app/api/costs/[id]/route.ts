import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { CostType, PaymentStatus } from "@prisma/client";
import { z } from "zod";

const updateCostSchema = z.object({
  wbs_id: z.string().uuid().optional(),
  cost_type: z.nativeEnum(CostType).optional(),
  amount: z.number().positive().optional(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  supplier: z.string().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCostSchema.parse(body);

    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Cost record not found");

    const item = await prisma.costRecord.update({
      where: { id },
      data: {
        ...(data.wbs_id !== undefined && { wbs_id: data.wbs_id }),
        ...(data.cost_type !== undefined && { cost_type: data.cost_type }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.unit_price !== undefined && { unit_price: data.unit_price }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

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
    });
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
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Cost record not found");

    await prisma.costRecord.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
