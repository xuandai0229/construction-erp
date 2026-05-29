import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { CashBankService } from "@/services/cash-bank.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  try {
    const doc = await CashBankService.getDocument((await params).id, {
      id: user.id,
      companyId: user.companyId,
    });
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
