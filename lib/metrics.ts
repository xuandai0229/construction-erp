import { round } from "./math";

interface LatencyRecord {
  route: string;
  durationMs: number;
  timestamp: number;
}

export class MetricsCollector {
  private static MAX_HISTORY = 100; // Bounded ring-buffer capacity to prevent memory growth (Batch 7.5)
  private static apiLatencies: LatencyRecord[] = [];
  
  // Counters & Metrics Stats
  private static totalPostings = 0;
  private static postingDurationSum = 0;
  private static reconciliationFailures = 0;
  private static failedAuthAttempts = 0;
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
   * Records Reconciliation Failure event (Batch 7.5)
   */
  static recordReconciliationFailure() {
    this.reconciliationFailures++;
  }

  /**
   * Records Failed Authentication / Suspicious Attempt (Batch 7.5)
   */
  static recordFailedAuthAttempt() {
    this.failedAuthAttempts++;
  }

  /**
   * Records Data Export Usage (Batch 7.5)
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
   * Gathers all operational metrics (Batch 7.5)
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
        failedAuthAttemptsCount: this.failedAuthAttempts
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
