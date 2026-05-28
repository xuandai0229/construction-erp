
import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  const data = await request.json();
  data.advanceRequestId = (await params).id;
  try {
    const doc = await AdvanceSettlementService.createSettlement(data, user.id, user.companyId || undefined);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
