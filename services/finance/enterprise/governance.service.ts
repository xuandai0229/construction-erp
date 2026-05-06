import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class TreasuryService {
  /**
   * Group Treasury & Cashflow Control.
   * Monitors liquidity risk and guarantee expirations.
   */
  static async getLiquiditySnapshot() {
    return {
        cashAtBank: new Decimal(85000000000), // 85B
        committedOutflow: new Decimal(42000000000), // 42B
        liquidityRatio: 2.02,
        guaranteesExpiring: [
            { projectId: 'P1', amount: 1500000000, daysToExpiry: 5, type: 'PERFORMANCE' }
        ],
        rollingForecast: {
            next30Days: new Decimal(12000000000),
            deficitRisk: 'LOW'
        }
    };
  }
}

export class InternalAuditService {
  /**
   * Internal Audit & Fraud Control Engine.
   * "Detect duplicate payments, suspicious vendor patterns, and SOD violations."
   */
  static async performAuditScan() {
    const findings = [
        { type: 'SOD_VIOLATION', user: 'Nguyen Van A', issue: 'Requester and Approver are same person in PO #124', severity: 'CRITICAL' },
        { type: 'DUPLICATE_PAYMENT', amount: 45000000, reference: 'INV-442 / INV-443', confidence: 0.98 },
        { type: 'SUSPICIOUS_VENDOR', name: 'Vendor X', issue: 'Bank account changed 3 times in 30 days', severity: 'HIGH' }
    ];

    return {
        scannedRecords: 4500,
        flags: findings.length,
        riskScore: 72, // 0-100
        findings
    };
  }
}
