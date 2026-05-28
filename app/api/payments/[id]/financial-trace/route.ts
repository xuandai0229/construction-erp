import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { RBAC } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  RBAC.assertPermission(user.role, "REVENUE", "READ");

  const id = (await params).id;
  
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        contract: true,
        allocations: true,
      }
    });

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      paymentId: payment.id,
      amount: payment.amount,
      invoice: payment.invoice,
      contract: payment.contract,
      allocations: payment.allocations,
      journals: [], // TBD: fetch from journal entry where sourceId = payment.id
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
