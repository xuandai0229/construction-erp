import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class ReconciliationService {
  static async getMaterialReconciliation(projectId: string) {
    const [materials, poItems, consumption] = await Promise.all([
      prisma.material.findMany(),
      prisma.purchaseOrderItem.findMany({
        where: { purchaseOrder: { projectId } }
      }),
      prisma.siteConsumption.findMany({
        where: { projectId }
      })
    ]);

    const report = materials.map(m => {
      const received = poItems
        .filter(item => item.description.includes(m.name) || item.description.includes(m.code))
        .reduce((s, i) => s + Number(i.quantity), 0);
      
      const consumed = consumption
        .filter(c => c.materialId === m.id)
        .reduce((s, c) => s + Number(c.quantity), 0);

      const remaining = received - consumed;
      const variance = remaining < 0 ? "SHORTAGE" : "STOCK";

      return {
        materialId: m.id,
        name: m.name,
        code: m.code,
        received: round(received, 3),
        consumed: round(consumed, 3),
        remaining: round(remaining, 3),
        variance
      };
    });

    return report;
  }
}
