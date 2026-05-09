import { prisma } from "@/lib/prisma";
import { LoggerService } from "./logger.service";

export class QueueService {
  static async enqueue(type: string, payload: any, options: { priority?: number, runAt?: Date } = {}) {
    return await prisma.job.create({
      data: {
        type,
        payload,
        priority: options.priority ?? 0,
        runAt: options.runAt ?? new Date(),
      }
    });
  }

  static async processNext() {
    const job = await prisma.job.findFirst({
      where: {
        status: "PENDING",
        runAt: { lte: new Date() },
        attempts: { lt: prisma.job.fields.maxAttempts }
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" }
      ]
    });

    if (!job) return null;

    // Transition to PROCESSING
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: { 
        status: "PROCESSING", 
        processedAt: new Date(),
        attempts: { increment: 1 }
      }
    });

    return updatedJob;
  }

  static async complete(id: string, result?: any) {
    return await prisma.job.update({
      where: { id },
      data: { 
        status: "COMPLETED", 
        finishedAt: new Date(),
        result 
      }
    });
  }

  static async fail(id: string, error: string) {
    const job = await prisma.job.findUnique({ where: { id } });
    const isPermanentFail = (job?.attempts ?? 0) >= (job?.maxAttempts ?? 3);
    
    return await prisma.job.update({
      where: { id },
      data: { 
        status: isPermanentFail ? "FAILED" : "PENDING", 
        error 
      }
    });
  }
}
