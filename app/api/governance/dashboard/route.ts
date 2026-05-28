import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { DashboardGovernance } from "@/lib/governance/dashboard-governance";
import { toEnterpriseRole } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await assertAuthenticated();
    return NextResponse.json({
      success: true,
      data: {
        role: toEnterpriseRole(user.role),
        widgets: DashboardGovernance.widgetsForRole(user.role),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
