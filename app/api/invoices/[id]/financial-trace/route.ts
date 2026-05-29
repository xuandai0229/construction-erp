import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { RBAC } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  RBAC.assertPermission(user.role, "REVENUE", "READ");

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
      invoiceId: invoice.id,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      remainingAmount: invoice.remainingAmount,
      contract: invoice.contract,
      payments: invoice.payments,
      allocations: invoice.allocations,
      journals: mappedJournals,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
