import { handleApiError, successResponse } from "@/lib/api-error";
import { RevenueService } from "@/services/revenue.service";
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
    
    // Phase 0: Mass assignment prevention. Omit amount. 
    // Changes to amount must use future reversal flow.
    const data = updateRevenueSchema.omit({ amount: true }).parse(body);

    const item = await RevenueService.updateRevenue(id, data);

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
