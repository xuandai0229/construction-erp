import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const updateRevenueSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateRevenueSchema.parse(body);

    const existing = await prisma.revenue.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Revenue record not found");

    const item = await prisma.revenue.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
      },
    });

    return successResponse({
      id: item.id,
      projectId: item.projectId,
      wbsId: item.wbsId,
      invoiceId: item.invoiceId,
      amount: item.amount,
      date: item.date.toISOString(),
      status: item.status,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
