
export interface ProjectFinancialSnapshot {
  projectId: string;
  timestamp: Date;
  version: string; // The "Financial Era" hash
  reality: AccountingReality;
  exposure: ManagementExposure;
  integrity: DataIntegrityMetrics;
}

export interface AccountingReality {
  totalRevenue: number;    // REV_ACC
  actualCost: number;      // COST_ACT
  grossProfit: number;     // PROFIT_REALIZED
  grossMargin: number;
}

export interface ManagementExposure {
  totalCostExposure: number; // COST_EXP
  pendingCost: number;       // Exposure - Reality
  budgetUtilization: number;
  isOverBudget: boolean;
}

export interface DataIntegrityMetrics {
  unallocatedAmount: number; // Orphans
  allocationHealth: number;   // % of costs with valid WBS
  orphanCount: number;
}

export interface WBSAggregationResult {
  tree: any[]; // Using any[] for now to avoid deep EnrichedWBSNode circular deps
  stats: {
    totalApproved: number;
    orphanTotal: number;
    healthScore: number;
  };
}

export type KPIContract = 'COST_ACT' | 'COST_EXP' | 'REV_ACC' | 'PROFIT_REALIZED' | 'BUDGET_UTILIZATION';

export type AggregationStatus = 'STABLE' | 'WARNING' | 'CRITICAL';
