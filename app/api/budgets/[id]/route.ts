import { handleApiError, successResponse } from "@/lib/api-error";
import { BudgetService } from "@/services/budget.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await BudgetService.delete(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
