import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const createRevenueSchema = z.object({
  projectId: z.string().uuid(),
  wbsId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  date: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    const items = await prisma.revenue.findMany({
      where: { ...(projectId && { project_id: projectId }) },
      orderBy: { date: "desc" },
    });

    const mapped = items.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      wbs_id: r.wbs_id,
      invoice_id: r.invoice_id,
      amount: r.amount,
      date: r.date.toISOString(),
      status: r.status,
      description: r.description,
      created_at: r.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createRevenueSchema.parse(body);

    const item = await prisma.revenue.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId,
        invoice_id: data.invoiceId ?? null,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status ?? PaymentStatus.unpaid,
        description: data.description ?? "",
      },
    });

    return successResponse({
      id: item.id,
      project_id: item.project_id,
      wbs_id: item.wbs_id,
      invoice_id: item.invoice_id,
      amount: item.amount,
      date: item.date.toISOString(),
      status: item.status,
      description: item.description,
      created_at: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
