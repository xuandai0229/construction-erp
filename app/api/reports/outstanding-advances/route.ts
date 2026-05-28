
import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { AdvanceReportService } from "@/services/advance-report.service";

export async function GET(request: NextRequest) {
  const user = await assertAuthenticated();
  
  try {
    const report = await AdvanceReportService.getOutstandingAdvances(user.companyId || "");
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
