import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validations";
import { RevenueService } from "@/services/revenue.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const invoiceId = searchParams.get("invoiceId") || undefined;

    const items = await prisma.payment.findMany({
      where: {
        ...(projectId && { project_id: projectId }),
        ...(invoiceId && { invoice_id: invoiceId }),
      },
      orderBy: { date: "desc" },
    });

    const mapped = items.map((p) => ({
      id: p.id,
      invoice_id: p.invoice_id,
      project_id: p.project_id,
      amount: p.amount,
      date: p.date.toISOString(),
      description: p.description,
      created_at: p.createdAt.toISOString(),
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
      invoice_id: result.invoice_id,
      project_id: result.project_id,
      amount: result.amount,
      date: result.date.toISOString(),
      description: result.description,
      created_at: result.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
