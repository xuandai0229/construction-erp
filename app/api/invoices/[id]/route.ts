import { handleApiError, successResponse } from "@/lib/api-error";
import { RevenueService } from "@/services/revenue.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Phase 0: Use RevenueService instead of direct Prisma delete
    // Note: If invoice has payments, it will fail due to DB FK constraint, 
    // which is the CORRECT accounting behavior. You should not delete an invoice that has payments.
    await RevenueService.deleteInvoice(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
