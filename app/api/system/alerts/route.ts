import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditSecurityAccess, requireAdmin } from "@/lib/route-security";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const user = await requireAdmin();
    await auditSecurityAccess({
      userId: user.id,
      entity: "SystemAlerts",
      entityId: user.companyId || "GLOBAL",
      reason: "System alerts accessed.",
      severity: "WARNING",
    });

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
  } catch (error) {
    return handleApiError(error);
  }
}
