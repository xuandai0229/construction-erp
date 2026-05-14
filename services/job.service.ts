
import { prisma } from "../lib/prisma";
import { LoggerService } from "./logger.service";
import { DiagnosticsService } from "./diagnostics.service";

export class JobService {
  /**
   * Enqueue a new background job
   */
  static async enqueue(type: string, payload: any = {}, options: { runAt?: Date, priority?: number } = {}) {
    return prisma.job.create({
      data: {
        type,
        payload,
        runAt: options.runAt || new Date(),
        priority: options.priority || 0,
        status: "PENDING"
      }
    });
  }

  /**
   * Process pending jobs (Worker Loop)
   */
  static async processJobs() {
    const jobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
        runAt: { lte: new Date() }
      },
      orderBy: [
        { priority: "desc" },
        { runAt: "asc" }
      ],
      take: 10
    });

    for (const job of jobs) {
      await this.executeJob(job);
    }
  }

  private static async executeJob(job: any) {
    try {
      // 1. Mark as processing
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: "PROCESSING", processedAt: new Date(), attempts: { increment: 1 } } 
      });

      // 2. Execute based on type
      if (job.type === "NIGHTLY_RECONCILIATION") {
        await DiagnosticsService.systemHealthCheck();
      } else if (job.type === "CACHE_WARMUP") {
        // Trigger dashboard warming
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      // 3. Mark as finished
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: "FINISHED", finishedAt: new Date() } 
      });

      await LoggerService.info(`JobFinished: ${job.type} (${job.id})`);
    } catch (e: any) {
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: job.attempts >= job.maxAttempts ? "FAILED" : "PENDING", error: e.message } 
      });
      await LoggerService.error(`JobFailed: ${job.type} (${job.id})`, e);
    }
  }
}
