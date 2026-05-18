import { handleApiError, successResponse } from "@/lib/api-error";
import { updateCostSchema } from "@/lib/validations";
import { CostService } from "@/services/cost.service";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { headers } from "next/headers";

async function getServiceOptions(userId: string) {
  const head = await headers();
  return {
    userId,
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "COST", "UPDATE");

    // Verify record exists and belongs to the user's company (Tenant Isolation)
    if (user.companyId) {
      const existing = await prisma.costRecord.findFirst({
        where: { id, companyId: user.companyId }
      });
      if (!existing) {
        throw new ApiError(404, "Không tìm thấy chi phí hoặc chi phí không thuộc công ty của bạn.");
      }
    }

    const body = await request.json();
    const data = updateCostSchema.parse(body);
    const options = await getServiceOptions(user.id);

    const item = await CostService.update(id, data, options);

    return successResponse(item, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "COST", "DELETE");

    // Verify record exists and belongs to the user's company (Tenant Isolation)
    if (user.companyId) {
      const existing = await prisma.costRecord.findFirst({
        where: { id, companyId: user.companyId }
      });
      if (!existing) {
        throw new ApiError(404, "Không tìm thấy chi phí hoặc chi phí không thuộc công ty của bạn.");
      }
    }

    const options = await getServiceOptions(user.id);
    await CostService.delete(id, options);
    return successResponse({ deleted: true }, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}

