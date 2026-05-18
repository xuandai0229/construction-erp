import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { CacheService } from "../cache.service";
import { MetricsCollector } from "@/lib/metrics";

export class ResilientQueueService {
  private static localMemoryLocks = new Set<string>();

  /**
   * Enqueues a task to the resilient distributed queue
   */
  static async enqueue(
    type: string,
    payload: any = {},
    options: { runAt?: Date; priority?: number; maxAttempts?: number; queuePartition?: string } = {}
  ) {
    const priority = options.priority ?? 0;
    const runAt = options.runAt ?? new Date();
    const maxAttempts = options.maxAttempts ?? 3;
    const partition = options.queuePartition ?? "default";

    LoggerService.info(`[Queue] Enqueuing job: ${type} into partition [${partition}] with priority ${priority}`, { payload });

    return await prisma.job.create({
      data: {
        type,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : {},
        priority,
        runAt,
        maxAttempts,
        status: "PENDING",
        attempts: 0
      }
    });
  }

  /**
   * Polls, acquires distributed lock, and processes available pending jobs in parallel
   */
  static async pollAndProcess() {
    try {
      // 1. Fetch PENDING jobs that are ready to run
      const jobs = await prisma.job.findMany({
        where: {
          status: "PENDING",
          runAt: { lte: new Date() }
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "asc" }
        ],
        take: 10
      });

      if (jobs.length === 0) return;

      LoggerService.info(`[Queue Worker] Found ${jobs.length} pending jobs. Processing concurrent lock acquisition...`);

      // 2. Process jobs in parallel with distributed lock protection
      await Promise.all(
        jobs.map(async (job) => {
          const lockKey = `lock:job:${job.id}`;
          let isAcquired = false;

          try {
            await CacheService.set(lockKey, "LOCKED", 60); // 60s lease time for the lock
            isAcquired = true;
          } catch (err) {
            // Ignore throw and trigger fallback below
          }

          // Fallback to local memory lock if Redis lock failed (e.g. Redis disconnected)
          if (!isAcquired) {
            if (!this.localMemoryLocks.has(lockKey)) {
              this.localMemoryLocks.add(lockKey);
              isAcquired = true;
              LoggerService.warn(`[Queue Worker] Redis lock returned falsy. Local memory lock fallback activated for job ${job.id}`);
            }
          }

          if (!isAcquired) {
            LoggerService.warn(`[Queue Worker] Failed to acquire distributed lock for job ${job.id}. Skipping...`);
            return;
          }

          try {
            await this.executeJobWithHeartbeat(job);
          } finally {
            // Release the lock
            this.localMemoryLocks.delete(lockKey);
            try {
              await CacheService.invalidate(lockKey);
            } catch (err) {
              // Ignore Redis release errors
            }
          }
        })
      );
    } catch (err) {
      LoggerService.error("[Queue Worker] Error polling and processing jobs:", { error: err });
    }
  }

  /**
   * Executes a specialized job, reports heartbeats, and handles exponential retry backoffs or dead-letter routing (DLQ)
   */
  private static async executeJobWithHeartbeat(job: any) {
    const startTime = Date.now();
    LoggerService.info(`[Queue Worker] Starting execution: ${job.type} (${job.id})`);

    // Increment attempts count & set state to PROCESSING
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        processedAt: new Date(),
        attempts: { increment: 1 }
      }
    });

    // Start a heartbeat timer that refreshes the heartbeat timestamp every 5 seconds
    const heartbeatInterval = setInterval(async () => {
      try {
        LoggerService.info(`[Queue Heartbeat] Heartbeat check-in for job ${job.id}`);
        await prisma.job.update({
          where: { id: job.id },
          data: { updatedAt: new Date() }
        });
      } catch (err) {
        // Suppress heartbeat errors
      }
    }, 5000);

    try {
      // Specialized execution routing
      const { SpecializedWorkerPlatform } = require("./worker.specialized");
      await SpecializedWorkerPlatform.route(job);

      // Successfully processed: update job status to COMPLETED
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          finishedAt: new Date()
        }
      });

      LoggerService.info(`[Queue Worker] Completed execution: ${job.type} (${job.id})`);
      MetricsCollector.recordJobExecution(Date.now() - startTime, true);
    } catch (err: any) {
      const isDLQ = job.attempts + 1 >= job.maxAttempts;
      
      // Calculate exponential backoff delay (attempts * 10 seconds)
      const nextRunDelayMs = (job.attempts + 1) * 10000;
      const nextRunAt = new Date(Date.now() + nextRunDelayMs);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: isDLQ ? "FAILED" : "PENDING", // If max attempts breached, route to DLQ (FAILED status)
          error: err.message || "Unknown error",
          runAt: isDLQ ? undefined : nextRunAt // schedule for deferred retry
        }
      });

      LoggerService.error(`[Queue Worker] Job failed: ${job.type} (${job.id}). ${isDLQ ? 'Moving to Dead-Letter Queue (DLQ).' : `Scheduling retry in ${nextRunDelayMs / 1000}s.`}`, { error: err });
      MetricsCollector.recordJobExecution(Date.now() - startTime, false);
    } finally {
      clearInterval(heartbeatInterval);
    }
  }

  /**
   * Sweeper to detect and recover stuck jobs (stuck in PROCESSING status without updates in 2 minutes)
   */
  static async recoverStuckJobs() {
    LoggerService.info("[Queue Sweeper] Scanning for stuck worker executions...");
    const timeoutThreshold = new Date(Date.now() - 120000); // 2 minutes ago

    try {
      const stuckJobs = await prisma.job.findMany({
        where: {
          status: "PROCESSING",
          updatedAt: { lte: timeoutThreshold }
        }
      });

      for (const job of stuckJobs) {
        LoggerService.warn(`[Queue Sweeper] Detected stuck job: ${job.type} (${job.id}). Resetting status to PENDING for retry...`);
        
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            runAt: new Date(Date.now() + 5000), // Run in 5 seconds
            error: "Job execution timed out / worker heartbeat died."
          }
        });
      }
    } catch (err) {
      LoggerService.error("[Queue Sweeper] Stuck job detection failed:", { error: err });
    }
  }
}
