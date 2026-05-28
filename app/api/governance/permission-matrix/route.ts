import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/route-security";
import { ENTERPRISE_PERMISSION_MATRIX, ENTERPRISE_ROLE_LABELS } from "@/lib/rbac";

export async function GET() {
  try {
    await requirePermission("AUDIT", "READ");
    return NextResponse.json({
      success: true,
      data: {
        roles: ENTERPRISE_ROLE_LABELS,
        matrix: ENTERPRISE_PERMISSION_MATRIX,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
