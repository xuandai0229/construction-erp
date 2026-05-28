import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";
import { FinancialReportsService } from "@/services/financial-reports.service";

export async function GET(request: Request) {
  try {
    await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    const report = await FinancialReportsService.getCashFlowReport(projectId);
    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    return handleApiError(error);
  }
}
