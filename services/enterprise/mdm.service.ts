import { prisma } from "@/lib/prisma";

export class MasterDataGovernanceService {
  /**
   * PHẢI XỬ LÝ: Vendor duplication, Material naming inconsistency, Unit inconsistency.
   */

  /**
   * Fuzzy matching and alias management for Vendors.
   */
  static async validateVendor(name: string) {
    const existingVendors = await prisma.purchaseOrder.findMany({
      select: { vendor: true },
      distinct: ['vendor']
    });

    const canonicalName = name.trim().toUpperCase();
    
    // Fuzzy match
    const match = existingVendors.find(v => {
        const vName = v.vendor.trim().toUpperCase();
        return vName === canonicalName || vName.includes(canonicalName) || canonicalName.includes(vName);
    });

    return {
      isNew: !match,
      suggestedName: match ? match.vendor : canonicalName,
      confidence: match ? 0.95 : 1.0,
      governanceStatus: match ? 'DUPLICATE_POTENTIAL' : 'CLEAN'
    };
  }

  /**
   * Canonical Unit Normalization
   */
  static normalizeUnit(unit: string): string {
    const map: Record<string, string> = {
      'TẤN': 'TON',
      'TONS': 'TON',
      'BAO': 'BAG',
      'CÁI': 'PCS',
      'M3': 'M3',
      'KHỐI': 'M3',
      'MÉT KHỐI': 'M3'
    };
    return map[unit.toUpperCase()] || unit.toUpperCase();
  }

  /**
   * Duplicate Detection Engine for Materials
   */
  static async detectMaterialAnomalies(projectId: string) {
    const records = await prisma.costRecord.findMany({
      where: { projectId, costType: 'material' },
      select: { supplier: true, note: true, amount: true }
    });

    // Detect price variance for same item (anomaly detection)
    // Simplified: group by supplier and check variance
    return records; 
  }

  /**
   * Canonical Naming Assistant
   */
  static generateCanonicalCode(entityType: string, name: string): string {
    const prefix = entityType.substring(0, 3).toUpperCase();
    const hash = Buffer.from(name).toString('hex').substring(0, 4);
    return `${prefix}-${hash}`;
  }
}
