import { NextRequest, NextResponse } from "next/server";
import { CloseManagementService } from "@/services/finance/close/closeManagement.service";
import { ReconciliationService }  from "@/services/finance/close/reconciliation.service";
import { ExceptionGovernanceService, FinanceOperationalAnalyticsService } from "@/services/finance/close/exception.service";

/**
 * GET /api/finance/close?period=2026-05
 * Returns: pre-close checklist, KPIs, and active exceptions for the War Room dashboard.
 */
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "Invalid period. Use YYYY-MM format." }, { status: 400 });
  }

  try {
    const [checklist, kpis, exceptions] = await Promise.all([
      CloseManagementService.runPreCloseChecklist(period),
      FinanceOperationalAnalyticsService.getCloseKPIs(period),
      ExceptionGovernanceService.scanForExceptions(),
    ]);

    const blockingCount = checklist.filter(c => c.status === "BLOCKING").length;
    const warningCount  = checklist.filter(c => c.status === "WARNING").length;
    const criticalExceptions = exceptions.filter(e => e.severity === "CRITICAL").length;

    return NextResponse.json({
      period,
      closeReadiness: blockingCount === 0 ? "READY" : "BLOCKED",
      blockingCount,
      warningCount,
      criticalExceptions,
      checklist,
      kpis,
      exceptions: exceptions.slice(0, 20), // Top 20 for dashboard
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/finance/close
 * Body: { period, lockedById, cfoCertification: true }
 * Locks the fiscal period after all checks pass.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { period, lockedById, cfoCertification } = body;

    if (!period || !lockedById) {
      return NextResponse.json({ error: "period and lockedById are required." }, { status: 400 });
    }

    const fp = await CloseManagementService.lockPeriod({ period, lockedById, cfoCertification });
    return NextResponse.json({ success: true, fiscalPeriod: fp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
}
