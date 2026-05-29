import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { CashBankService } from "@/services/cash-bank.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  try {
    const doc = await CashBankService.approveDocument((await params).id, user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
