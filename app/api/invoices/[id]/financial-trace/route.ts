import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();

  const id = (await params).id;
  
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: true,
        payments: true,
        allocations: true,
      }
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      invoiceId: invoice.id,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      remainingAmount: invoice.remainingAmount,
      contract: invoice.contract,
      payments: invoice.payments,
      allocations: invoice.allocations,
      journals: [], // TBD: fetch from journal entry where sourceId = invoice.id
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
