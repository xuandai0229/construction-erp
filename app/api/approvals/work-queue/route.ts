import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";
import { ApprovalQueueTab, ApprovalWorkQueueService } from "@/services/approval-work-queue.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("READ");
    const { searchParams } = new URL(request.url);
    const limitValue = Number(searchParams.get("limit") || 50);

    const data = await ApprovalWorkQueueService.getWorkQueue(user, {
      tab: (searchParams.get("tab") || "pending") as ApprovalQueueTab,
      status: searchParams.get("status"),
      documentType: searchParams.get("documentType"),
      projectId: searchParams.get("projectId"),
      createdBy: searchParams.get("createdBy"),
      assignedToMe: searchParams.get("assignedToMe") === "true",
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      limit: Number.isFinite(limitValue) ? limitValue : 50,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
