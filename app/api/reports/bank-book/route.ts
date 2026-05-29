import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { CashBankService } from "@/services/cash-bank.service";

export async function GET(request: NextRequest) {
  const user = await assertAuthenticated();
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const report = await CashBankService.getBankBook(
      { companyId, projectId, startDate, endDate },
      { id: user.id, companyId: user.companyId }
    );
    return NextResponse.json(report);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
