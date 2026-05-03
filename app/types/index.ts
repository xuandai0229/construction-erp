// ============================================
// CONSTRUCTION ERP - TYPE DEFINITIONS
// ============================================

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  investor: string;
  total_value: number; // Contract value
  contract_value: number; // Redundant but good for domain clarity
  signed_date?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  progress_status?: 'on_track' | 'delayed' | 'critical';
  created_at: string;
  updated_at?: string;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  revenue: number;
  cost: number;
  profit: number;
  cash_in: number;
  cash_out: number;
  running_balance: number;
}

export interface AgingReportItem {
  id: string;
  type: 'receivable' | 'payable';
  entity_name: string; // Supplier or Project name
  amount: number;
  date: string;
  days_overdue: number;
  category: '0-30' | '31-60' | '61-90' | '90+';
}

export interface WBSItem {
  id: string;
  project_id: string;
  name: string;
  parent_id: string | null;
  children: WBSItem[];
  created_at: string;
}

// Helper type for tree building
export interface WBSTreeNode extends WBSItem {
  level: number;
  isExpanded: boolean;
}

// ============================================
// COST MANAGEMENT TYPES
// ============================================

// Cost types for construction
export type CostType = 'material' | 'labor' | 'machine' | 'subcontract' | 'overhead' | 'other';

// Cost status
export type CostStatus = 'paid' | 'unpaid';

// Cost record interface
export interface CostRecord {
  id: string;
  project_id: string;
  wbs_id: string;
  cost_type: CostType;
  amount: number;
  quantity: number;
  unit_price: number;
  supplier?: string;
  note: string;
  date: string;
  status: CostStatus;
  created_at: string;
}

// Budget record interface
export interface BudgetRecord {
  id: string;
  project_id: string;
  wbs_id: string;
  cost_type: CostType;
  estimated_amount: number;
  created_at: string;
}

// Budget vs Actual comparison result
export interface BudgetVariance {
  wbs_id: string;
  wbs_name: string;
  cost_type: CostType;
  planned: number;
  actual: number;
  variance: number;
  percentage: number;
}

// Cost summary by type
export interface CostSummaryByType {
  cost_type: CostType;
  total: number;
  count: number;
  paid: number;
  unpaid: number;
}

// Cost summary by WBS
export interface CostSummaryByWBS {
  wbs_id: string;
  wbs_name: string;
  total: number;
  count: number;
}

// ============================================
// REVENUE & ACCOUNTING TYPES
// ============================================

export type RevenueStatus = 'paid' | 'unpaid';

export interface RevenueRecord {
  id: string;
  project_id: string;
  wbs_id: string;
  invoice_id?: string; // Linked invoice
  amount: number;
  date: string;
  status: RevenueStatus;
  description: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  project_id: string;
  amount: number;
  issued_date: string;
  paid_amount: number;
  remaining_amount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  project_id: string;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export type UserRole = 'admin' | 'accountant' | 'staff';

export interface AccountingLock {
  month: string; // YYYY-MM
  locked_at: string;
  locked_by: string;
}

export interface EnrichedWBSNode extends Omit<WBSTreeNode, 'children'> {
  code: string;
  budget: number;
  actual: number;
  revenue: number;
  profit: number;
  variance: number;
  percentage: number;
  status: string;
  isExpanded: boolean;
  children: EnrichedWBSNode[];
}

export interface DebtSummary {
  receivable: number;
  payable: number;
  total_revenue: number;
  overdue: number;
}

// ============================================
// DATA LAYER RESPONSE TYPES
// ============================================

export interface ProjectResponse {
  success: boolean;
  data?: Project;
  error?: string;
}

export interface WBSResponse {
  success: boolean;
  data?: WBSItem | WBSItem[];
  error?: string;
}

export interface CostResponse {
  success: boolean;
  data?: CostRecord | CostRecord[];
  error?: string;
}

export interface BudgetResponse {
  success: boolean;
  data?: BudgetRecord | BudgetRecord[];
  error?: string;
}

export interface RevenueResponse {
  success: boolean;
  data?: RevenueRecord | RevenueRecord[];
  error?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data?: InvoiceRecord | InvoiceRecord[];
  error?: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: PaymentRecord | PaymentRecord[];
  error?: string;
}

// ============================================
// LABELS & CONSTANTS
// ============================================

export const COST_TYPE_LABELS: Record<CostType, string> = {
  material: 'Vật liệu',
  labor: 'Nhân công',
  machine: 'Máy móc',
  subcontract: 'Thầu phụ',
  overhead: 'Chi phí chung',
  other: 'Chi phí khác',
};

export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
};
