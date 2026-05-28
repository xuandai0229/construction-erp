import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { RBAC } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAuthenticated();
  RBAC.assertPermission(user.role, "REVENUE", "READ");

  const id = (await params).id;
  
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        invoices: {
          include: {
            payments: true,
          }
        },
        payments: true,
      }
    });

    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Validate Tenant
    if (user.companyId && contract.projectId) {
        // Assume check logic here. 
    }

    return NextResponse.json({
      contractId: contract.id,
      value: contract.currentValue,
      invoices: contract.invoices,
      payments: contract.payments,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
