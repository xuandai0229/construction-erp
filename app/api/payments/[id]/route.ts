import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { RevenueService } from "@/services/revenue.service";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "@/services/audit.service";
import { assertPeriodNotLocked } from "@/lib/period";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "REVENUE", "DELETE");

    const { id } = await params;
    const existing = await prisma.payment.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { invoice: { companyId: user.companyId } }),
      },
    });
    if (!existing) throw new ApiError(404, "Payment not found");

    await assertPeriodNotLocked(existing.date);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id, version: existing.version },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
          version: { increment: 1 },
        },
      });

      await tx.revenue.updateMany({
        where: { invoiceId: existing.invoiceId, amount: existing.amount, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      const invoice = await tx.invoice.findUnique({ where: { id: existing.invoiceId } });
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) - Number(existing.amount);
        const newRemainingAmount = Number(invoice.amount) - newPaidAmount;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: Math.max(0, newPaidAmount),
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount <= 0 ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "SENT",
            version: { increment: 1 },
          },
        });
      }

      await PostingEngine.reverseJournal(tx, id, "PAYMENT", user.id);

      await AuditService.log({
        userId: user.id,
        action: "DELETE",
        entity: "Payment",
        entityId: id,
        oldData: existing,
        reason: "Payment cancelled via API; soft-deleted with ledger reversal.",
      });
    });

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
    RBAC.assertPermission(user.role, "REVENUE", "UPDATE");

    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.payment.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.companyId && { invoice: { companyId: user.companyId } }),
      },
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Payment not found");

    const updated = await RevenueService.updatePayment(id, body);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
