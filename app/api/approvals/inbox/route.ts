import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ApprovalInboxService } from "@/services/approval-inbox.service";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const pending = await ApprovalInboxService.getPendingInbox(user);
    const history = await ApprovalInboxService.getApprovedHistory(user);

    return successResponse({ pending, history });
  } catch (error) {
    return handleApiError(error);
  }
}
