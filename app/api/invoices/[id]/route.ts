import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Invoice not found");

    // Delete payments first, then invoice
    await prisma.payment.deleteMany({ where: { invoice_id: id } });
    await prisma.invoice.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
