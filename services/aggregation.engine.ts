import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export type KPIDefinition = {
  id: string;
  name: string;
  formula: (data: any) => number;
};

export class AggregationEngine {
  private static cache = new Map<string, { value: any; expiry: number }>();

  /**
   * Centralized KPI Registry
   */
  static readonly KPIS: Record<string, KPIDefinition> = {
    GROSS_MARGIN: {
      id: "GROSS_MARGIN",
      name: "Gross Margin %",
      formula: (data) => data.revenue > 0 ? round((data.revenue - data.cost) / data.revenue * 100, 2) : 0
    },
    BURN_RATE: {
      id: "BURN_RATE",
      name: "Monthly Burn Rate",
      formula: (data) => data.months > 0 ? round(data.totalCost / data.months, 0) : 0
    }
  };

  static async getCachedAggregation<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 300000): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value as T;
    }

    const value = await fetcher();
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
    return value;
  }
}
