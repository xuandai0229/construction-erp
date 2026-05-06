import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
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
        ...(data.wbsId !== undefined && { wbsId: data.wbsId }),
        ...(data.costType !== undefined && { costType: data.costType }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

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
