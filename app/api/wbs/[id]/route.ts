import { handleApiError, successResponse } from "@/lib/api-error";
import { WBSService } from "@/services/wbs.service";
import { z } from "zod";

// PHASE 0: Aligned with WBSService field names (parentId, not parent_id)
const updateWBSSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
  code: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // Support legacy snake_case field from older clients
    const normalized = {
      ...body,
      parentId: body.parentId ?? body.parent_id,
    };
    const data = updateWBSSchema.parse(normalized);
    const item = await WBSService.update(id, data);
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
    await WBSService.delete(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
