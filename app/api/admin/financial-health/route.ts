import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { MetricsService } from "@/services/metrics.service";

export async function GET() {
  try {
    const [
      snapshotCount,
      pendingEvents,
      failedEvents,
      totalCosts,
      totalInvoices,
      orphans
    ] = await Promise.all([
      (prisma as any).financialSnapshot ? (prisma as any).financialSnapshot.count() : Promise.resolve(0),
      (prisma as any).domainEvent ? (prisma as any).domainEvent.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      (prisma as any).domainEvent ? (prisma as any).domainEvent.count({ where: { status: "FAILED" } }) : Promise.resolve(0),
      prisma.costRecord.count({ where: { deletedAt: null } }),
      prisma.invoice.count({ where: { deletedAt: null } }),
      prisma.costRecord.count({ 
        where: { 
          deletedAt: null,
          wbs: {
            deletedAt: { not: null }
          }
        } 
      })
    ]);

    const metrics = MetricsService.getMetrics();

    const stats = {
      reliability: {
        snapshotCacheSize: snapshotCount,
        cacheHitRatio: metrics.cacheHitRatio,
        avgLatencyMs: metrics.avgLatency,
        eventOutbox: {
          pending: pendingEvents,
          failed: failedEvents,
        }
      },
      integrity: {
        totalRecords: totalCosts + totalInvoices,
        orphanCostCount: orphans,
        orphanRatio: (orphans / (totalCosts || 1)) * 100
      },
      performance: {
        health: failedEvents > 0 ? "CRITICAL" : (orphans > 10 ? "WARNING" : "OPTIMAL"),
        lastChecked: new Date()
      }
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
