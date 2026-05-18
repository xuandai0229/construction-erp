import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const alerts = await prisma.auditLog.findMany({
      where: {
        OR: [
          { severity: "CRITICAL" },
          { action: { in: ["UNLOCK", "RECONCILIATION_FAILURE", "UNAUTHORIZED_ACTION", "RESTORE_BACKUP", "REVERSE"] } }
        ]
      },
      orderBy: { timestamp: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
        severity: true,
        reason: true,
        correlationId: true,
        requestId: true,
        user: { select: { name: true, role: true } }
      },
    });

    return NextResponse.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
