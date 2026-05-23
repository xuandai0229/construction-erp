import { LoggerService } from "../logger.service";

export interface TraceSpan {
  requestId: string;
  correlationId: string;
  steps: { name: string; status: string; durationMs: number; timestamp: Date }[];
  startTime: number;
}

export class ObservabilityService {
  private static activeTraces = new Map<string, TraceSpan>();

  /**
   * Starts a new distributed trace span
   */
  static startTrace(requestId: string, correlationId: string) {
    LoggerService.info(`[Tracing] START TRACE span: ${requestId} (Correlation: ${correlationId})`);
    
    this.activeTraces.set(requestId, {
      requestId,
      correlationId,
      steps: [],
      startTime: Date.now()
    });
  }

  /**
   * Tracks an intermediate step in a distributed transaction trace
   */
  static traceStep(requestId: string, stepName: string, status: "SUCCESS" | "FAILED" | "PENDING", durationMs: number) {
    const trace = this.activeTraces.get(requestId);
    if (!trace) return;

    LoggerService.info(`[Tracing] SPAN STEP [${requestId}]: ${stepName} status: ${status} in ${durationMs}ms`);
    trace.steps.push({
      name: stepName,
      status,
      durationMs,
      timestamp: new Date()
    });
  }

  /**
   * Concludes a distributed trace, exporting metrics summary
   */
  static endTrace(requestId: string) {
    const trace = this.activeTraces.get(requestId);
    if (!trace) return null;

    const totalDuration = Date.now() - trace.startTime;
    LoggerService.info(`[Tracing] END TRACE span: ${requestId} (Correlation: ${trace.correlationId}) total duration: ${totalDuration}ms`);
    
    // Clean up
    this.activeTraces.delete(requestId);
    return {
      ...trace,
      totalDurationMs: totalDuration
    };
  }

  /**
   * SLA Breach Warning Alert Dispatcher
   */
  static async triggerSlaBreachAlert(requestId: string, data: any) {
    const message = `CRITICAL SLA BREACH ALERT: Request ${requestId} active step ${data.stepId} exceeded the dynamic SLA limit. Escalated to ${data.escalatedRole}`;
    
    LoggerService.error(`[Alert Manager] ${message}`, {
      alertType: "SLA_BREACH",
      requestId,
      ...data
    });

    // Create notifications for admins
    await this.persistAlertNotification("SLA_BREACH", "CRITICAL", message, data.companyId);
  }

  /**
   * Queue Overload Alert Dispatcher
   */
  static async triggerQueueOverloadAlert(pendingCount: number, companyId?: string) {
    const message = `SYSTEM WARNING: Distributed Queue Overloaded! Found ${pendingCount} enqueued tasks pending. Worker scaling threshold triggered.`;
    
    LoggerService.warn(`[Alert Manager] ${message}`, {
      alertType: "QUEUE_OVERLOAD",
      pendingCount
    });

    if (companyId) {
      await this.persistAlertNotification("QUEUE_OVERLOAD", "WARNING", message, companyId);
    }
  }

  /**
   * Tenant Boundary Violation Warning
   */
  static async triggerTenantViolationAlert(userId: string, targetProjectId: string, companyId: string) {
    const message = `SECURITY ALERT: User ${userId} attempted to access project ${targetProjectId} outside of their permitted Tenant / Hierarchy boundary!`;
    
    LoggerService.error(`[Alert Manager] ${message}`, {
      alertType: "TENANT_VIOLATION",
      userId,
      targetProjectId,
      companyId
    });

    await this.persistAlertNotification("TENANT_VIOLATION", "CRITICAL", message, companyId);
  }

  /**
   * Persists warnings to the Notification database model
   */
  private static async persistAlertNotification(type: string, severity: string, message: string, companyId: string) {
    try {
      const { prisma } = require("../prisma");
      
      // Find super admin or tenant admin users
      const admins = await prisma.user.findMany({
        where: { companyId, role: { in: ["ADMIN", "SUPER_ADMIN", "CFO"] } }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `System Alert: ${type}`,
            message,
            type,
            severity,
            priority: severity === "CRITICAL" ? 2 : 1,
            isRead: false
          }
        });
      }
    } catch (err) {
      // Suppress persistence failures
    }
  }
}
