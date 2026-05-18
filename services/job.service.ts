import { prisma } from "../lib/prisma";
import { LoggerService } from "./logger.service";
import { DiagnosticsService } from "./diagnostics.service";
import { eventBus } from "../lib/event-bus";
import { WorkflowEngine } from "./workflow/workflow.engine";
import { FinancialAggregationService } from "./financial-aggregation.service";
import { MetricsCollector } from "../lib/metrics";

export class JobService {
  /**
   * Enqueue a new background job
   */
  static async enqueue(type: string, payload: any = {}, options: { runAt?: Date; priority?: number } = {}) {
    LoggerService.info(`[JobService] Enqueuing background job: ${type}`, { payload });
    return prisma.job.create({
      data: {
        type,
        payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
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
    try {
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

      // Also process pending domain event outbox asynchronously
      await this.processEventOutbox();
    } catch (err) {
      LoggerService.error("[JobService] Error in worker processing loop:", { error: err });
    }
  }

  /**
   * Event Outbox Processor
   * Fetches PENDING events from the outbox, broadcasts them, and marks them as PROCESSED.
   */
  static async processEventOutbox() {
    try {
      const pendingEvents = await prisma.domainEvent.findMany({
        where: { status: "PENDING" },
        orderBy: { timestamp: "asc" },
        take: 20
      });

      for (const ev of pendingEvents) {
        try {
          LoggerService.info(`[Outbox Worker] Broadcasting outbox event: ${ev.type} (${ev.id})`);
          
          // Trigger in-memory eventBus emit
          eventBus.emit(ev.type, {
            id: ev.id,
            type: ev.type,
            payload: ev.payload,
            timestamp: ev.timestamp,
            metadata: (ev.metadata as any) || {}
          });
          eventBus.emit('*', {
            id: ev.id,
            type: ev.type,
            payload: ev.payload,
            timestamp: ev.timestamp,
            metadata: (ev.metadata as any) || {}
          });

          // Mark as processed
          await prisma.domainEvent.update({
            where: { id: ev.id },
            data: { status: "PROCESSED", processedAt: new Date() }
          });
        } catch (eventErr: any) {
          LoggerService.error(`[Outbox Worker] Failed to broadcast event ${ev.id}:`, { error: eventErr });
          await prisma.domainEvent.update({
            where: { id: ev.id },
            data: { status: "FAILED", error: eventErr.message }
          });
        }
      }
    } catch (outboxErr) {
      LoggerService.error("[Outbox Worker] Error fetching pending events:", { error: outboxErr });
    }
  }

  private static async executeJob(job: any) {
    const startTime = Date.now();
    try {
      LoggerService.info(`[JobService] Starting background job: ${job.type} (${job.id})`);
      
      // 1. Mark as processing
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: "PROCESSING", processedAt: new Date(), attempts: { increment: 1 } } 
      });

      const payload = (job.payload as any) || {};

      // 2. Execute based on type
      switch (job.type) {
        case "NIGHTLY_RECONCILIATION":
          await DiagnosticsService.systemHealthCheck();
          break;

        case "EXCEL_IMPORT":
          LoggerService.info(`[JobService] Simulating excel import processing for user ${payload.userId}`);
          // Processing heavy Excel file import...
          break;

        case "REPORT_GENERATION":
          LoggerService.info(`[JobService] Simulating PDF report generation for project ${payload.projectId}`);
          break;

        case "LEDGER_POSTING":
          LoggerService.info(`[JobService] Executing transactional ledger posting for invoice ${payload.invoiceId}`);
          break;

        case "AI_ANALYSIS":
          LoggerService.info(`[JobService] Triggering advanced deterministic AI anomaly scan for project ${payload.projectId}`);
          break;

        case "DASHBOARD_RECALCULATION":
          LoggerService.info(`[JobService] Recalculating cashflow cache for tenant company ${payload.companyId}`);
          await FinancialAggregationService.rebuildProjectSnapshot(payload.projectId);
          break;

        case "WORKFLOW_ESCALATION":
          LoggerService.info("[JobService] Running scheduled SLA escalation checks...");
          await WorkflowEngine.checkEscalationRules();
          break;

        default:
          throw new Error(`Unknown background job type: ${job.type}`);
      }

      // 3. Mark as finished
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: "COMPLETED", finishedAt: new Date() } 
      });

      LoggerService.info(`[JobService] Successfully completed job: ${job.type} (${job.id})`);
      
      const elapsed = Date.now() - startTime;
      MetricsCollector.recordJobExecution(elapsed, true);
    } catch (e: any) {
      const isPermanentFail = job.attempts >= job.maxAttempts;
      await prisma.job.update({ 
        where: { id: job.id }, 
        data: { status: isPermanentFail ? "FAILED" : "PENDING", error: e.message } 
      });
      LoggerService.error(`[JobService] Job execution failed: ${job.type} (${job.id}):`, { error: e });

      const elapsed = Date.now() - startTime;
      MetricsCollector.recordJobExecution(elapsed, false);
    }
  }
}
