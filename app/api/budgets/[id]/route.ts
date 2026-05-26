import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { updateBudgetSchema } from "@/lib/validations";
import { BudgetService } from "@/services/budget.service";
import { prisma } from "@/lib/prisma";
import { requireProjectPermission } from "@/lib/route-security";

async function requireBudgetMutationAccess(id: string) {
  const budget = await prisma.budgetRecord.findFirst({
    where: { id, deletedAt: null },
    select: { projectId: true },
  });
  if (!budget) throw new ApiError(404, "Budget item not found.");
  return requireProjectPermission(budget.projectId, "PROJECT", "UPDATE");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireBudgetMutationAccess(id);
    const body = await request.json();
    const data = updateBudgetSchema.parse(body);

    const item = await BudgetService.update(id, data, user.id);
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
    const { id } = await params;
    const user = await requireBudgetMutationAccess(id);
    await BudgetService.delete(id, user.id);
    return successResponse({ deleted: true }, "Xóa dự toán thành công");
  } catch (error) {
    return handleApiError(error);
  }
}
