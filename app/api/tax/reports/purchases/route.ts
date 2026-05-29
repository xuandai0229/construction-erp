import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";
import { TaxReportService } from "@/services/tax-report.service";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user.companyId) {
      return NextResponse.json({ success: false, error: "User has no company context" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await TaxReportService.getVatPurchases(user.companyId, startDate, endDate);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
