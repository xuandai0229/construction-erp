
import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { AdvanceService } from "@/services/advance.service";

export async function GET(request: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const user = await assertAuthenticated();
  const data = await request.json();
  try {
    const advance = await AdvanceService.createAdvance(data, user.id, user.companyId || undefined);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
