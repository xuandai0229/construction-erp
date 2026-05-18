import { round } from "./math";

interface LatencyRecord {
  route: string;
  durationMs: number;
  timestamp: number;
}

export class MetricsCollector {
  private static MAX_HISTORY = 100; // Bounded ring-buffer capacity to prevent memory growth
  private static apiLatencies: LatencyRecord[] = [];
  
  // Counters & Metrics Stats
  private static totalPostings = 0;
  private static postingDurationSum = 0;
  private static reconciliationFailures = 0;
  private static failedAuthAttempts = 0;
  private static tenantViolations = 0;
  private static slowQueries = 0;
  private static cacheHits = 0;
  private static cacheMisses = 0;
  
  // Workflow Engine Metrics
  private static totalWorkflowTransitions = 0;
  private static workflowDurationSum = 0;
  
  // Queue & Background Job Metrics
  private static totalJobsProcessed = 0;
  private static jobDurationSum = 0;
  private static failedJobs = 0;
  
  // Event Bus Metrics
  private static totalEventsDispatched = 0;

  private static exportUsage: Record<string, number> = {
    CSV: 0,
    PDF: 0,
    EXCEL: 0,
    JSON: 0
  };

  /**
   * Records API Latency safely in bounded memory
   */
  static recordApiLatency(route: string, durationMs: number) {
    this.apiLatencies.push({ route, durationMs, timestamp: Date.now() });
    if (this.apiLatencies.length > this.MAX_HISTORY) {
      this.apiLatencies.shift(); // Evict oldest record
    }
  }

  /**
   * Records Journal Posting Duration
   */
  static recordPostingDuration(durationMs: number) {
    this.totalPostings++;
    this.postingDurationSum += durationMs;
  }

  /**
   * Records Reconciliation Failure event
   */
  static recordReconciliationFailure() {
    this.reconciliationFailures++;
  }

  /**
   * Records Failed Authentication / Suspicious Attempt
   */
  static recordFailedAuthAttempt() {
    this.failedAuthAttempts++;
  }

  /**
   * Records Tenant Isolation Violation attempt
   */
  static recordTenantViolation() {
    this.tenantViolations++;
  }

  /**
   * Records slow DB query metrics
   */
  static recordSlowQuery() {
    this.slowQueries++;
  }

  /**
   * Records cache operations
   */
  static recordCacheHit() {
    this.cacheHits++;
  }

  static recordCacheMiss() {
    this.cacheMisses++;
  }

  /**
   * Records workflow transition metrics
   */
  static recordWorkflowTransition(durationMs: number) {
    this.totalWorkflowTransitions++;
    this.workflowDurationSum += durationMs;
  }

  /**
   * Records queue job latency and status
   */
  static recordJobExecution(durationMs: number, success: boolean) {
    this.totalJobsProcessed++;
    this.jobDurationSum += durationMs;
    if (!success) {
      this.failedJobs++;
    }
  }

  /**
   * Records event bus broadcasts
   */
  static recordEventDispatched() {
    this.totalEventsDispatched++;
  }

  /**
   * Records Data Export Usage
   */
  static recordExportUsage(exportType: string) {
    const type = exportType.toUpperCase();
    if (this.exportUsage[type] !== undefined) {
      this.exportUsage[type]++;
    } else {
      this.exportUsage[type] = 1;
    }
  }

  /**
   * Gathers all operational metrics
   */
  static getMetrics() {
    const mem = process.memoryUsage();
    
    // Calculate average API latency
    const avgLatency = this.apiLatencies.length > 0
      ? round(this.apiLatencies.reduce((sum, r) => sum + r.durationMs, 0) / this.apiLatencies.length, 2)
      : 0;

    // Calculate average posting duration
    const avgPostingDuration = this.totalPostings > 0
      ? round(this.postingDurationSum / this.totalPostings, 2)
      : 0;

    // Calculate average workflow latency
    const avgWorkflowLatency = this.totalWorkflowTransitions > 0
      ? round(this.workflowDurationSum / this.totalWorkflowTransitions, 2)
      : 0;

    // Calculate average queue latency
    const avgQueueLatency = this.totalJobsProcessed > 0
      ? round(this.jobDurationSum / this.totalJobsProcessed, 2)
      : 0;

    // Calculate cache hit rate
    const totalCacheOps = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheOps > 0
      ? round((this.cacheHits / totalCacheOps) * 100, 2)
      : 100;

    return {
      api: {
        averageLatencyMs: avgLatency,
        totalCallsTracked: this.apiLatencies.length,
        history: this.apiLatencies
      },
      posting: {
        totalPostings: this.totalPostings,
        averageDurationMs: avgPostingDuration
      },
      reconciliation: {
        failuresCount: this.reconciliationFailures
      },
      security: {
        failedAuthAttemptsCount: this.failedAuthAttempts,
        tenantViolationsCount: this.tenantViolations
      },
      database: {
        slowQueriesCount: this.slowQueries
      },
      cache: {
        hitRate: cacheHitRate,
        hits: this.cacheHits,
        misses: this.cacheMisses
      },
      workflow: {
        totalTransitions: this.totalWorkflowTransitions,
        averageDurationMs: avgWorkflowLatency
      },
      queue: {
        totalProcessed: this.totalJobsProcessed,
        averageDurationMs: avgQueueLatency,
        failedJobsCount: this.failedJobs
      },
      events: {
        totalDispatched: this.totalEventsDispatched
      },
      exports: this.exportUsage,
      memory: {
        rss: `${round(mem.rss / 1024 / 1024, 2)} MB`,
        heapTotal: `${round(mem.heapTotal / 1024 / 1024, 2)} MB`,
        heapUsed: `${round(mem.heapUsed / 1024 / 1024, 2)} MB`,
        external: `${round(mem.external / 1024 / 1024, 2)} MB`
      },
      timestamp: new Date().toISOString()
    };
  }
}
