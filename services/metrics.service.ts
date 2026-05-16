export class MetricsService {
  private static cacheHits = 0;
  private static cacheMisses = 0;
  private static aggregationLatencies: number[] = [];

  static recordCacheHit() {
    this.cacheHits++;
  }

  static recordCacheMiss() {
    this.cacheMisses++;
  }

  static recordLatency(ms: number) {
    this.aggregationLatencies.push(ms);
    if (this.aggregationLatencies.length > 100) this.aggregationLatencies.shift();
  }

  static getMetrics() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheHitRatio: total > 0 ? (this.cacheHits / total) * 100 : 100,
      avgLatency: this.aggregationLatencies.length > 0 
        ? this.aggregationLatencies.reduce((a, b) => a + b, 0) / this.aggregationLatencies.length 
        : 0,
      totalRequests: total
    };
  }
}
