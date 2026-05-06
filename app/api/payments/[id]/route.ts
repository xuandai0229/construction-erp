import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Payment not found");

    // Restore invoice balance on delete
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      const invoice = await tx.invoice.findUnique({ where: { id: existing.invoiceId } });
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) - Number(existing.amount);
        const newRemainingAmount = Number(invoice.amount) - newPaidAmount;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: Math.max(0, newPaidAmount),
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount <= 0 ? "PAID" : "PARTIAL",
          },
        });
      }
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
