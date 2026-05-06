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
      projectId: inv.projectId,
      wbsId: inv.wbsId,
      amount: inv.amount,
      issuedDate: inv.issuedDate.toISOString(),
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      status: inv.status,
      wbsName: inv.wbs.name,
      createdAt: inv.createdAt.toISOString(),
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
      projectId: item.projectId,
      wbsId: item.wbsId,
      amount: item.amount,
      issuedDate: item.issuedDate.toISOString(),
      paidAmount: item.paidAmount,
      remainingAmount: item.remainingAmount,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


