import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { buildRecentAuditWhere, normalizeAuditLimit, toAuditReadItem } from "@/lib/audit-log-read-model";
import { requirePermission } from "@/lib/route-security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePermission("AUDIT", "READ");

    const { searchParams } = new URL(request.url);
    const limit = normalizeAuditLimit(searchParams.get("limit"));
    const scope = searchParams.get("scope");
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const where = buildRecentAuditWhere(scope, entity, action);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit + 1,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.slice(0, limit).map(toAuditReadItem),
        total,
        hasMore: items.length > limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
