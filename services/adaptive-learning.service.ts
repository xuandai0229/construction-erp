import { prisma } from "@/lib/prisma";
import { OrganizationalMemoryService } from "./organizational-memory.service";

export class AdaptiveLearningService {
  /**
   * Analyzes historical patterns to adapt operational thresholds.
   */
  static async getAdaptiveThresholds(projectId: string) {
    const learnings = await OrganizationalMemoryService.getPastLearnings("PERFORMANCE_DEGRADATION");
    
    // Simple logic: if we have many "CRITICAL" events in memory, we tighten thresholds
    const criticalCount = learnings.filter(l => (l.newData as any).severity === "HIGH").length;
    
    const baseThreshold = 0.9;
    const adaptedThreshold = baseThreshold + (criticalCount * 0.01); // Tighten by 1% for each major failure

    return {
      projectId,
      baseThreshold,
      adaptedThreshold: Math.min(0.98, adaptedThreshold),
      reasoning: `Adapted threshold based on ${criticalCount} historical performance failures.`
    };
  }
}
