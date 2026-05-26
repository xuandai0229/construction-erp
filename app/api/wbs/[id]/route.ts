import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { z } from "zod";
import { WBSService } from "@/services/wbs.service";
import { prisma } from "@/lib/prisma";
import { requireProjectPermission } from "@/lib/route-security";

const updateWBSSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

async function requireWBSMutationAccess(id: string) {
  const item = await prisma.wBSItem.findFirst({
    where: { id, deletedAt: null },
    select: { projectId: true },
  });
  if (!item) throw new ApiError(404, "WBS item not found.");
  return requireProjectPermission(item.projectId, "PROJECT", "UPDATE");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireWBSMutationAccess(id);
    const body = await request.json();
    const data = updateWBSSchema.parse(body);

    const item = await WBSService.update(id, data, user.id);
    return successResponse(item);
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
    const user = await requireWBSMutationAccess(id);
    // Bắt buộc gọi qua Service để kiểm tra ràng buộc tài chính, orphans, cấp con.
    await WBSService.delete(id, user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
