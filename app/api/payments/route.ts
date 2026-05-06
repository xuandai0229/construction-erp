import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validations";
import { RevenueService } from "@/services/revenue.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id") || undefined;
    const invoiceId = searchParams.get("invoiceId") || searchParams.get("invoice_id") || undefined;

    const items = await prisma.payment.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(invoiceId && { invoiceId }),
      },
      orderBy: { date: "desc" },
    });

    const mapped = items.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      projectId: p.projectId,
      amount: p.amount,
      date: p.date.toISOString(),
      description: p.description,
      createdAt: p.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    const result = await RevenueService.createPayment(data);

    return successResponse({
      id: result.id,
      invoiceId: result.invoiceId,
      projectId: result.projectId,
      amount: result.amount,
      date: result.date.toISOString(),
      description: result.description,
      createdAt: result.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


