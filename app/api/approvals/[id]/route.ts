import { requireAccountingAccess } from "@/lib/route-security";
import { handleApiError, successResponse } from "@/lib/api-error";
import { ApprovalInboxService } from "@/services/approval-inbox.service";

export async function GET(request: Request, props: { params: Promise<any> }) {
  try {
    const user = await requireAccountingAccess("READ");
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");

    if (!module) {
      throw new Error("Query parameter 'module' is required");
    }

    const doc = await ApprovalInboxService.getDocById(id, module, user.companyId);
    return successResponse(doc);
  } catch (error) {
    return handleApiError(error);
  }
}
