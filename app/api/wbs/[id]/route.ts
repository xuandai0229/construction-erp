import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWBSSchema = z.object({
  name: z.string().min(1).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateWBSSchema.parse(body);

    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "WBS item not found");

    const item = await prisma.wBSItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      },
    });
    return successResponse(item);
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
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "WBS item not found");

    await prisma.wBSItem.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
