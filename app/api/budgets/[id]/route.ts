import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { updateBudgetSchema } from "@/lib/validations";
import { BudgetService } from "@/services/budget.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) throw new ApiError(401, "Authentication required");

    const { id } = await params;
    const body = await request.json();
    const data = updateBudgetSchema.parse(body);

    const item = await BudgetService.update(id, data, userId);
    return successResponse({ id: item.id }, "Cập nhật dự toán thành công");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) throw new ApiError(401, "Authentication required");

    const { id } = await params;
    await BudgetService.delete(id, userId);
    return successResponse({ deleted: true }, "Xóa dự toán thành công");
  } catch (error) {
    return handleApiError(error);
  }
}
