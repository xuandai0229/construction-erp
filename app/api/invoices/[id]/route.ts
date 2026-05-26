import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { RevenueService } from "@/services/revenue.service";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "INVOICE", "DELETE");

    const { id } = await params;
    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { companyId: user.companyId }),
      },
    });
    if (!existing) throw new ApiError(404, "Invoice not found");

    const { searchParams } = new URL(request.url);
    const reason =
      searchParams.get("reason") ||
      request.headers.get("x-audit-reason") ||
      "Invoice cancelled via API endpoint.";

    await RevenueService.deleteInvoice(id, user.id, reason);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "INVOICE", "UPDATE");

    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { companyId: user.companyId }),
      },
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Invoice not found");

    const updated = await RevenueService.updateInvoice(id, body, user.id);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
