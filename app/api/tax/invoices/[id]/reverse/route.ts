import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";
import { TaxInvoiceService } from "@/services/tax-invoice.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, props: RouteParams) {
  try {
    const user = await requirePermission("INVOICE", "REVERSE");
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await request.json();

    const invoice = await TaxInvoiceService.reverseInvoice(id, user.companyId, user.id, body.reason);
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return handleApiError(error);
  }
}
