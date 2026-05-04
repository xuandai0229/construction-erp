import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.budgetRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Budget record not found");

    await prisma.budgetRecord.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
