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
    const projectId = searchParams.get("projectId") || searchParams.get("project_id") || undefined;

    const items = await prisma.revenue.findMany({
      where: { ...(projectId && { projectId }) },
      orderBy: { date: "desc" },
    });

    const mapped = items.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      wbsId: r.wbsId,
      invoiceId: r.invoiceId,
      amount: r.amount,
      date: r.date.toISOString(),
      status: r.status,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
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
        projectId: data.projectId,
        wbsId: data.wbsId,
        invoiceId: data.invoiceId ?? null,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status ?? PaymentStatus.unpaid,
        description: data.description ?? "",
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
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
