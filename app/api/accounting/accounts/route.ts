import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";

export async function GET() {
  try {
    await requireAccountingAccess("READ");

    const accounts = await prisma.ledgerAccount.findMany({
      where: { deletedAt: null },
      include: {
        parent: { select: { id: true, code: true, name: true } }
      },
      orderBy: { code: "asc" }
    });

    return NextResponse.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    return handleApiError(error);
  }
}
