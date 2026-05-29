import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ApprovalInboxService } from "@/services/approval-inbox.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAccountingAccess("APPROVE");
    const { id } = await params;
    const { module } = await request.json();

    const result = await ApprovalInboxService.approveDoc(id, module, user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
