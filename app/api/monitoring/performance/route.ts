import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const stats = await prisma.$transaction([
      prisma.auditLog.count({ where: { severity: "CRITICAL" } }),
      prisma.auditLog.count({ where: { severity: "WARNING" } }),
      prisma.job.count({ where: { status: "FAILED" } }),
      prisma.costRecord.count(),
      prisma.invoice.count()
    ]);

    const [criticalLogs, warningLogs, failedJobs, totalCosts, totalInvoices] = stats;

    return successResponse({
      systemHealth: criticalLogs === 0 ? "HEALTHY" : "CRITICAL",
      metrics: {
        criticalLogs,
        warningLogs,
        failedJobs,
        totalCosts,
        totalInvoices
      },
      timestamp: new Date()
    });
  } catch (error) {
    return handleApiError(error);
  }
}
