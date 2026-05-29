import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { CashBankService } from "@/services/cash-bank.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  try {
    const body = await request.json();
    const doc = await CashBankService.rejectDocument((await params).id, body.reason, user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
