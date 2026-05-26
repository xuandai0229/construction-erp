import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';
import { MetricsCollector } from '@/lib/metrics';
import { requireAdmin, requireAuth } from '@/lib/route-security';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await prisma.$transaction([
      prisma.auditLog.count({ where: { severity: "CRITICAL" } }),
      prisma.auditLog.count({ where: { severity: "WARNING" } }),
      prisma.costRecord.count(),
      prisma.invoice.count()
    ]);

    const [criticalLogs, warningLogs, totalCosts, totalInvoices] = stats;
    
    // Retrieve authoritative in-memory system metrics
    const collectorMetrics = MetricsCollector.getMetrics();

    return successResponse({
      systemHealth: criticalLogs === 0 ? "HEALTHY" : "CRITICAL",
      databaseMetrics: {
        criticalLogs,
        warningLogs,
        totalCosts,
        totalInvoices
      },
      performanceMetrics: collectorMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const { type } = await request.json();
    if (type) {
      MetricsCollector.recordExportUsage(type);
    }
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
