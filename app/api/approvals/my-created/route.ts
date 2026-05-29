import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ApprovalInboxService } from "@/services/approval-inbox.service";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const myCreated = await ApprovalInboxService.getMyCreated(user);
    return successResponse(myCreated);
  } catch (error) {
    return handleApiError(error);
  }
}
