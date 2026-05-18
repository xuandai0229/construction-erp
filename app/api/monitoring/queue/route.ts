import { handleApiError, successResponse } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { JobService } from "@/services/job.service";
import { prisma } from "@/lib/prisma";
import { MetricsCollector } from "@/lib/metrics";

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      throw new Error("Only system administrators can access queue diagnostics.");
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "20");

    const [jobs, failedJobs, processedCount] = await Promise.all([
      prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        take: limit
      }),
      prisma.job.findMany({
        where: { status: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 10
      }),
      prisma.job.count({
        where: { status: "COMPLETED" }
      })
    ]);

    const systemMetrics = MetricsCollector.getMetrics();

    return successResponse({
      workerHealth: "ACTIVE",
      totalJobsCOMPLETED: processedCount,
      currentQueue: jobs,
      failedJobs: failedJobs,
      metrics: {
        totalProcessed: systemMetrics.queue.totalProcessed,
        averageDurationMs: systemMetrics.queue.averageDurationMs,
        failedJobsCount: systemMetrics.queue.failedJobsCount
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      throw new Error("Only system administrators can trigger worker iterations.");
    }

    const body = await request.json();
    const { action, type, payload } = body;

    if (action === "TRIGGER_WORKER") {
      const startTime = Date.now();
      await JobService.processJobs();
      const elapsed = Date.now() - startTime;
      return successResponse({ success: true, elapsedMs: elapsed }, "Background worker iteration triggered successfully.");
    }

    if (action === "ENQUEUE") {
      if (!type) throw new Error("Missing job type parameter.");
      const job = await JobService.enqueue(type, payload || {});
      return successResponse(job, "Background job enqueued successfully.", 201);
    }

    throw new Error("Invalid queue action.");
  } catch (error) {
    return handleApiError(error);
  }
}
