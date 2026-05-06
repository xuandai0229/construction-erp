import { prisma } from "@/lib/prisma";

export class PilotRefinementService {
  /**
   * P1: Unit Normalization Matrix
   * Automatically converts units to canonical forms to avoid mismatches.
   */
  static async normalizeUnit(input: string): Promise<string> {
    const matrix: Record<string, string> = {
      'Tấn': 'TON',
      'Ton': 'TON',
      'Bao': 'BAG',
      'Cái': 'PCS',
      'm3': 'M3',
      'Khối': 'M3'
    };
    return matrix[input] || input.toUpperCase();
  }

  /**
   * P6: BOQ -> WBS Intelligence Mapping Suggestion
   * Uses simple similarity matching for pilot.
   */
  static async suggestWBSMapping(projectId: string, boqDescription: string) {
    const wbsItems = await prisma.wBSItem.findMany({
      where: { projectId }
    });

    // Simple heuristic: Find WBS whose name is contained in BOQ description or vice-versa
    const suggestions = wbsItems
      .map(wbs => ({
        wbs,
        score: this.calculateMatchScore(boqDescription, wbs.name)
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return suggestions.slice(0, 3).map(s => s.wbs);
  }

  private static calculateMatchScore(s1: string, s2: string): number {
    const words1 = s1.toLowerCase().split(' ');
    const words2 = s2.toLowerCase().split(' ');
    const common = words1.filter(w => words2.includes(w));
    return common.length;
  }

  /**
   * P4: Vendor Deduplication Assistant
   */
  static async findPotentialDuplicateVendors() {
    const vendors = await prisma.purchaseOrder.findMany({
      select: { vendor: true },
      distinct: ['vendor']
    });

    const duplicates = [];
    // O(n^2) but fine for pilot vendor counts (< 100)
    for (let i = 0; i < vendors.length; i++) {
      for (let j = i + 1; j < vendors.length; j++) {
        if (this.isSimilar(vendors[i].vendor, vendors[j].vendor)) {
          duplicates.push({ v1: vendors[i].vendor, v2: vendors[j].vendor });
        }
      }
    }
    return duplicates;
  }

  private static isSimilar(v1: string, v2: string): boolean {
    const n1 = v1.toLowerCase().replace(/\s/g, '');
    const n2 = v2.toLowerCase().replace(/\s/g, '');
    return n1.includes(n2) || n2.includes(n1);
  }
}
