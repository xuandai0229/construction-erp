
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
    totalBudget: number;
    totalActual: number;
    totalApproved: number;
    orphanTotal: number;
    healthScore: number;
    progress: number;
  };
}

export interface AgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

export interface MonthlyReportRow {
  month: string;
  cashIn: number;
  cashOut: number;
  revenue: number;
  cost: number;
  profit: number;
  runningBalance: number;
}

export type KPIContract = 'COST_ACT' | 'COST_EXP' | 'REV_ACC' | 'PROFIT_REALIZED' | 'BUDGET_UTILIZATION';

export type AggregationStatus = 'STABLE' | 'WARNING' | 'CRITICAL';

export interface FinancialAnomaly {
  id: string;
  type: 'COST_SPIKE' | 'MARGIN_COLLAPSE' | 'VENDOR_CONCENTRATION' | 'ORPHAN_EXPLOSION' | 'BURN_ACCELERATION' | 'RECONCILIATION_DRIFT' | 'BUDGET_OVERRUN' | 'DELAYED_APPROVALS' | 'REVENUE_RECOGNITION_DELAY' | 'SNAPSHOT_INSTABILITY';
  severity: AggregationStatus;
  message: string;
  detectedAt: Date;
  metadata: Record<string, any>;
  isAcknowledged: boolean;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  actionType: 'CONTRACT_REVIEW' | 'PAYMENT_HALT' | 'BILLING_ACCELERATION' | 'BUDGET_REALLOCATION' | 'AUDIT_REQUIRED' | 'RECONCILIATION_FIX' | 'APPROVAL_ACCELERATION' | 'RECONCILIATION_AUDIT' | 'DATA_ALIGNMENT' | 'RISK_ESCALATION';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  impactLevel: number; // 0-100
  operationalRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  financialRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceLevel: number; // 0-100
  confidenceReason: string;
  blockingSeverity: 'BLOCKER' | 'NON_BLOCKER';
  suggestedBy: string; // The rule/engine name
  traceability: string[];
}

export interface RootCauseAnalysis {
  driver: string;
  explanation: string;
  operationalImpact: string;
  financialImpact: string;
  evidence: string[]; // List of Cost IDs, Invoice IDs, etc.
}

export interface EnhancedFinancialAnomaly extends FinancialAnomaly {
  rootCause?: RootCauseAnalysis;
  recommendations: ActionRecommendation[];
  escalationLevel: number; // 0, 1, 2, 3
  ownerId?: string;
  slaDeadline?: Date;
  status: 'DETECTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'MUTED';
}

export interface ExecutiveInsight {
  id: string;
  title: string;
  explanation: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  driver: string; // The primary cause
  suggestion?: string;
}

export interface OperationalMetrics {
  rebuildDurationMs: number;
  cacheHitRatio: number;
  pendingEventCount: number;
  failedEventCount: number;
  lastSnapshotFreshness: number; // minutes
  reconciliationMismatchCount: number;
}

export interface FinancialHealthScore {
  score: number; // 0-100
  status: AggregationStatus;
  components: {
    dataIntegrity: number;
    reconciliation: number;
    operationalStability: number;
    budgetAdherence: number;
  };
  lastUpdated: Date;
}

export interface HistoricalTrendPoint {
  date: string;
  burnRate: number;
  margin: number;
  budgetUtilization: number;
}

export interface IntelligenceSnapshot extends ProjectFinancialSnapshot {
  anomalies: EnhancedFinancialAnomaly[];
  insights: ExecutiveInsight[];
  health: FinancialHealthScore;
  operational: OperationalMetrics;
  trends?: HistoricalTrendPoint[];
}
