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

    const journals = await prisma.journalEntry.findMany({
      where: {
        sourceId: id,
        deletedAt: null
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    });

    const mappedJournals = journals.map(j => ({
      id: j.id,
      date: j.date,
      reference: j.reference,
      description: j.description,
      lines: j.lines.map(l => ({
        id: l.id,
        accountCode: l.account.code,
        debit: l.type === "DEBIT" ? Number(l.amount) : 0,
        credit: l.type === "CREDIT" ? Number(l.amount) : 0,
        description: l.description || j.description
      }))
    }));

    return NextResponse.json({
      paymentId: payment.id,
      amount: payment.amount,
      invoice: payment.invoice,
      contract: payment.contract,
      allocations: payment.allocations,
      journals: mappedJournals,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
