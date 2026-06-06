import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { assertPeriodNotLocked } from "@/lib/period";
import { AuditService } from "@/services/audit.service";

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
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "REVENUE", "UPDATE");

    const { id } = await params;
    const data = updateRevenueSchema.parse(await request.json());

    const existing = await prisma.revenue.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { wbs: { project: { companyId: user.companyId } } }),
      },
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy khoản doanh thu.");
    if (existing.invoiceId) {
      throw new ApiError(400, "Doanh thu gắn với hóa đơn không được sửa trực tiếp. Vui lòng dùng quy trình điều chỉnh/hủy hóa đơn hoặc thanh toán.");
    }

    await assertPeriodNotLocked(existing.date, user.companyId || undefined);
    if (data.date) {
      await assertPeriodNotLocked(new Date(data.date), user.companyId || undefined);
    }

    const item = await prisma.revenue.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "UPDATE",
      entity: "Revenue",
      entityId: item.id,
      oldData: existing,
      newData: item,
      reason: "Manual revenue record updated through guarded API.",
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "REVENUE", "DELETE");

    const { id } = await params;
    const existing = await prisma.revenue.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { wbs: { project: { companyId: user.companyId } } }),
      },
    });
    if (!existing) throw new ApiError(404, "Không tìm thấy khoản doanh thu.");
    if (existing.invoiceId) {
      throw new ApiError(400, "Doanh thu gắn với hóa đơn không được xóa trực tiếp. Vui lòng dùng quy trình hủy hóa đơn hoặc hoàn thanh toán.");
    }

    await assertPeriodNotLocked(existing.date, user.companyId || undefined);

    const item = await prisma.revenue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await AuditService.log({
      userId: user.id,
      action: "DELETE",
      entity: "Revenue",
      entityId: id,
      oldData: existing,
      newData: item,
      reason: "Manual revenue record soft-deleted through guarded API.",
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
