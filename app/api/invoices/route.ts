import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { createInvoiceSchema } from "@/lib/validations";
import { RevenueService } from "@/services/revenue.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    if (!projectId) return successResponse([]);

    const items = await RevenueService.findInvoicesByProject(projectId);

    const mapped = items.map((inv) => ({
      id: inv.id,
      project_id: inv.project_id,
      wbs_id: inv.wbs_id,
      amount: inv.amount,
      issued_date: inv.issued_date.toISOString(),
      paid_amount: inv.paid_amount,
      remaining_amount: inv.remaining_amount,
      status: inv.status,
      wbs_name: inv.wbs.name,
      created_at: inv.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    const item = await RevenueService.createInvoice(data);

    return successResponse({
      id: item.id,
      project_id: item.project_id,
      wbs_id: item.wbs_id,
      amount: item.amount,
      issued_date: item.issued_date.toISOString(),
      paid_amount: item.paid_amount,
      remaining_amount: item.remaining_amount,
      status: item.status,
      created_at: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
