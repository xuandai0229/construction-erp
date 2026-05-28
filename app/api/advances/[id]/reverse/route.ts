
import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { AdvanceService } from "@/services/advance.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  try {
    const advance = await AdvanceService.reverseAdvance((await params).id, user.id);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
