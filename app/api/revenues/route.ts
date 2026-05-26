import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { assertPeriodNotLocked } from "@/lib/period";
import { AuditService } from "@/services/audit.service";

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
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "REVENUE", "READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id") || undefined;

    const items = await prisma.revenue.findMany({
      where: {
        deletedAt: null,
        ...(projectId && { projectId }),
        ...(user.companyId && { wbs: { project: { companyId: user.companyId } } }),
      },
      orderBy: { date: "desc" },
    });

    const mapped = items.map((revenue) => ({
      id: revenue.id,
      projectId: revenue.projectId,
      wbsId: revenue.wbsId,
      invoiceId: revenue.invoiceId,
      amount: revenue.amount,
      date: revenue.date.toISOString(),
      status: revenue.status,
      description: revenue.description,
      createdAt: revenue.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "REVENUE", "CREATE");

    const data = createRevenueSchema.parse(await request.json());
    const revenueDate = data.date ? new Date(data.date) : new Date();
    await assertPeriodNotLocked(revenueDate, user.companyId || undefined);

    const wbs = await prisma.wBSItem.findFirst({
      where: {
        id: data.wbsId,
        projectId: data.projectId,
        deletedAt: null,
        ...(user.companyId && { project: { companyId: user.companyId } }),
      },
      select: { id: true },
    });
    if (!wbs) throw new ApiError(403, "WBS is not accessible for the current project/tenant context.");

    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: data.invoiceId,
          projectId: data.projectId,
          wbsId: data.wbsId,
          deletedAt: null,
          ...(user.companyId && { companyId: user.companyId }),
        },
        select: { id: true },
      });
      if (!invoice) throw new ApiError(403, "Invoice is not accessible for the current revenue context.");
    }

    const item = await prisma.revenue.create({
      data: {
        projectId: data.projectId,
        wbsId: data.wbsId,
        invoiceId: data.invoiceId ?? null,
        amount: data.amount,
        date: revenueDate,
        status: data.status ?? PaymentStatus.unpaid,
        description: data.description ?? "",
        createdById: user.id,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "CREATE",
      entity: "Revenue",
      entityId: item.id,
      newData: item,
      reason: "Manual revenue record created through guarded API.",
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
