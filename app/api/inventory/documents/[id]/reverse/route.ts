import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";
import { InventoryService } from "@/services/inventory.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("LEDGER", "REVERSE");
    const { id } = await props.params;
    const body = await request.json();
    const doc = await InventoryService.reverseDocument(id, body.reason, user.id);
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return handleApiError(error);
  }
}
