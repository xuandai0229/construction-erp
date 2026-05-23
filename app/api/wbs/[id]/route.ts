import { cookies } from "next/headers";
import { SessionManager } from "@/lib/session";
import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { z } from "zod";
import { WBSService } from "@/services/wbs.service";

const updateWBSSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("erp-session")?.value;
    const session = SessionManager.verifySession(token || null);
    const userId = session?.userId;
    
    if (!userId) {
      return handleApiError(new ApiError(401, "Authentication required"));
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateWBSSchema.parse(body);

    const item = await WBSService.update(id, data, userId);
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
    const cookieStore = await cookies();
    const token = cookieStore.get("erp-session")?.value;
    const session = SessionManager.verifySession(token || null);
    const userId = session?.userId;
    
    if (!userId) {
      return handleApiError(new ApiError(401, "Authentication required"));
    }

    const { id } = await params;
    // Bắt buộc gọi qua Service để kiểm tra ràng buộc tài chính, orphans, cấp con.
    await WBSService.delete(id, userId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
