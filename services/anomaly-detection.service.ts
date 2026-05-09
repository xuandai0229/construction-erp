import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class AnomalyDetectionService {
  static async detectAnomalies(projectId: string) {
    const anomalies: any[] = [];

    const [costs, project] = await Promise.all([
      prisma.costRecord.findMany({ where: { projectId, deletedAt: null } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!project) return [];

    // 1. Detect Duplicate Payments (Simple)
    const seen = new Set();
    costs.forEach(c => {
      const key = `${c.amount}-${c.date.toISOString().split('T')[0]}-${c.purchaseOrderId || 'na'}`;
      if (seen.has(key)) {
        anomalies.push({
          type: "DUPLICATE_PAYMENT_RISK",
          severity: "HIGH",
          message: `Potential duplicate cost of ${c.amount} detected for date ${c.date.toLocaleDateString()}`,
          entityId: c.id
        });
      }
      seen.add(key);
    });

    // 2. Cost Spikes (> 3x Average)
    const totalAmount = costs.reduce((s, c) => s + Number(c.amount), 0);
    const avgAmount = costs.length > 0 ? totalAmount / costs.length : 0;
    
    costs.forEach(c => {
      if (Number(c.amount) > avgAmount * 5 && Number(c.amount) > 1000000) { // Spike threshold
        anomalies.push({
          type: "COST_SPIKE",
          severity: "MEDIUM",
          message: `Abnormal cost amount (${c.amount}) which is 5x higher than average`,
          entityId: c.id
        });
      }
    });

    return anomalies;
  }
}
