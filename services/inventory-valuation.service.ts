import { prisma } from "@/lib/prisma";
import { round } from "@/lib/math";

export class InventoryValuationService {
  static async getInventoryValuation(projectId: string) {
    const [materials, transactions] = await Promise.all([
      prisma.material.findMany(),
      prisma.inventoryTransaction.findMany({
        where: { projectId }
      })
    ]);

    const valuation = materials.map(m => {
      const mTrans = transactions.filter(t => t.materialId === m.id);
      
      const totalInQty = mTrans.filter(t => t.type === 'RECEIPT').reduce((s, t) => s + Number(t.quantity), 0);
      const totalInValue = mTrans.filter(t => t.type === 'RECEIPT').reduce((s, t) => s + (Number(t.quantity) * Number(t.unitPrice || 0)), 0);
      
      const avgCost = totalInQty > 0 ? totalInValue / totalInQty : 0;
      
      const totalOutQty = mTrans.filter(t => t.type === 'ISSUE').reduce((s, t) => s + Number(t.quantity), 0);
      
      const currentQty = totalInQty - totalOutQty;
      const currentValue = currentQty * avgCost;

      return {
        materialId: m.id,
        name: m.name,
        code: m.code,
        currentQty: round(currentQty, 3),
        avgCost: round(avgCost, 2),
        currentValue: round(currentValue, 0)
      };
    });

    return valuation;
  }
}
