import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { CashBankService } from "@/services/cash-bank.service";

export async function GET(request: NextRequest) {
  const user = await assertAuthenticated();
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const documentType = searchParams.get("documentType") as any || undefined;
    const status = searchParams.get("status") as any || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;

    const list = await CashBankService.listDocuments(
      { companyId, projectId, documentType, status, startDate, endDate, search },
      { id: user.id, companyId: user.companyId }
    );
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const user = await assertAuthenticated();
  try {
    const body = await request.json();
    const doc = await CashBankService.createDocument(body, user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
