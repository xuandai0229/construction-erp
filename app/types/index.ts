// ============================================
// CONSTRUCTION ERP - TYPE DEFINITIONS
// ============================================

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  investor: string;
  total_value: number;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
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

// Cost type labels
export const COST_TYPE_LABELS: Record<CostType, string> = {
  material: 'Vật liệu',
  labor: 'Nhân công',
  machine: 'Máy móc',
  subcontract: 'Thầu phụ',
  overhead: 'Chi phí chung',
  other: 'Chi phí khác',
};

// Cost status labels
export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
};
