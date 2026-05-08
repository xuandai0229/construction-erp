import { prisma } from "@/lib/prisma";
import { TransactionType, CostType, UserRole } from "@prisma/client";
import { Decimal } from "decimal.js";

/**
 * Enterprise Portfolio Control Service
 * HARDENED: Centralized management of project health and risk across the entire organization.
 */
export class PortfolioControlService {
  
  /**
   * Aggregates health metrics across the entire project portfolio.
   */
  static async getPortfolioHealth() {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        costs: { select: { amount: true, status: true } },
        revenues: { select: { amount: true, status: true } }
      }
    });

    return projects.map(p => {
      const totalBudget = new Decimal(p.totalValue || 0);
      const totalActual = p.costs.reduce((acc, c) => acc.plus(c.amount), new Decimal(0));
      const totalRevenue = p.revenues.reduce((acc, r) => acc.plus(r.amount), new Decimal(0));

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        budgetUtilization: totalBudget.gt(0) ? totalActual.dividedBy(totalBudget).mul(100).toDecimalPlaces(1).toNumber() : 0,
        riskLevel: this.calculateRiskLevel(totalActual, totalBudget),
        profitability: totalRevenue.gt(0) ? totalRevenue.minus(totalActual).dividedBy(totalRevenue).mul(100).toDecimalPlaces(1).toNumber() : 0
      };
    });
  }

  private static calculateRiskLevel(actual: Decimal, budget: Decimal) {
    if (budget.eq(0)) return "STABLE";
    if (actual.gt(budget)) return "CRITICAL";
    if (actual.gt(budget.mul(0.9))) return "HIGH";
    return "STABLE";
  }
}

/**
 * Delegation of Authority (DOA) & Policy Engine
 * HARDENED: Strict enforcement of financial thresholds and routing.
 */
export class GovernancePolicyService {
  
  /**
   * Resolves who has the authority to approve a specific amount.
   */
  static async resolveAuthority(params: {
    amount: number | Decimal;
    entityType: string;
    projectId: string;
  }) {
    const amount = new Decimal(params.amount);
    
    // Thresholds (Should be in DB, but hardened here for now)
    if (amount.gt(5000000000)) return UserRole.ADMIN; // > 5 Billion
    if (amount.gt(1000000000)) return UserRole.MANAGER; // > 1 Billion
    return UserRole.MANAGER; 
  }

  /**
   * Evaluates governance risks for a transaction.
   */
  static async evaluateTransactionRisk(amount: number | Decimal, costType: CostType) {
    const dAmount = new Decimal(amount);
    const risks: string[] = [];

    if (dAmount.gt(2000000000)) risks.push("EXTREME_EXPOSURE");
    if (costType === 'subcontract' && dAmount.gt(500000000)) risks.push("SUBCON_THRESHOLD_REACHED");

    return {
      isHighRisk: risks.length > 0,
      risks,
      requiresExecutiveAudit: dAmount.gt(5000000000)
    };
  }
}

/**
 * Master Data Governance (MDM)
 * HARDENED: Ensuring data consistency across the ERP.
 */
export class MasterDataGovernanceService {
  
  /**
   * Normalizes unit names to canonical forms.
   */
  static normalizeUnit(unit: string): string {
    const map: Record<string, string> = {
      'TẤN': 'TON', 'TONS': 'TON',
      'BAO': 'BAG', 'CÁI': 'PCS',
      'M3': 'M3', 'KHỐI': 'M3', 'MÉT KHỐI': 'M3'
    };
    return map[unit.trim().toUpperCase()] || unit.trim().toUpperCase();
  }

  /**
   * Simple fuzzy match for vendor names to prevent duplicates.
   */
  static async suggestCanonicalVendor(name: string) {
    const vendors = await prisma.costRecord.findMany({
      select: { supplier: true },
      distinct: ['supplier']
    });

    const target = name.trim().toUpperCase();
    const match = vendors.find(v => v.supplier.toUpperCase().includes(target) || target.includes(v.supplier.toUpperCase()));

    return match ? match.supplier : name;
  }
}
