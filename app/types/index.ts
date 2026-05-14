// ============================================
// CONSTRUCTION ERP - TYPE DEFINITIONS
// ============================================

import { 
  ProjectStatus, TaskStatus, CostType as PrismaCostType, 
  PaymentStatus as PrismaPaymentStatus, InvoiceStatus as PrismaInvoiceStatus,
  UserRole as PrismaUserRole 
} from "../../generated/prisma-client";

export { ProjectStatus, TaskStatus };

// ─────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  ownerId?: string | null;
  investor?: string | null;
  contractValue: number;
  totalBudget: number;
  totalValue?: number;
  startDate?: string | null;
  endDate?: string | null;
  projectType?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: PrismaUserRole;
  createdAt: string;
}

export interface WBSItem {
  id: string;
  projectId: string;
  name: string;
  code?: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  budgetAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// FINANCIAL ENTITIES
// ─────────────────────────────────────────────

export type CostType = PrismaCostType;
export type PaymentStatus = PrismaPaymentStatus;
export type RevenueStatus = PrismaPaymentStatus;
export type InvoiceStatus = PrismaInvoiceStatus;

export interface CostRecord {
  id: string;
  projectId: string;
  wbsId: string;
  costType: CostType;
  amount: number;
  quantity: number;
  unitPrice: number;
  supplier?: string | null;
  note?: string | null;
  date: string;
  status: PaymentStatus;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  workflowStatus: string;
  approvalStatus: string;
}

export interface BudgetRecord {
  id: string;
  projectId: string;
  wbsId: string;
  costType: CostType;
  estimatedAmount: number;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Budget = BudgetRecord;

export interface RevenueRecord {
  id: string;
  projectId: string;
  wbsId: string;
  invoiceId?: string | null;
  amount: number;
  date: string;
  status: PaymentStatus;
  description?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  projectId: string;
  wbsId: string;
  invoiceNumber?: string | null;
  amount: number;
  issuedDate: string;
  dueDate?: string | null;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  projectId: string;
  amount: number;
  date: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// ANALYTICS & UI TYPES
// ─────────────────────────────────────────────

export interface MonthlyReport {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  cashIn: number;
  cashOut: number;
  runningBalance: number;
}

export interface AgingReportItem {
  id: string;
  type: 'receivable' | 'payable';
  entityName: string; 
  amount: number;
  date: string;
  daysOverdue: number;
  category: '0-30' | '31-60' | '61-90' | '90+';
}

export interface WBSTreeNode extends WBSItem {
  isExpanded: boolean;
  children: WBSTreeNode[];
}

export interface EnrichedWBSNode extends Omit<WBSTreeNode, 'children'> {
  budget: number;
  actual: number;
  revenue: number;
  profit: number;
  variance: number;
  percentage: number;
  status: string;
  children: EnrichedWBSNode[];
}

export interface DashboardStats {
  totalCost: number;
  paidCost: number;
  unpaidCost: number;
  costByType: Record<string, number>;
  totalBudget: number;
  budgetByType: Record<string, number>;
  costVariance: number;
  costOverrunPct: number;
  isCostOverrun: boolean;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  totalInvoiced: number;
  totalPaidInvoice: number;
  totalRemainingInvoice: number;
  overdueInvoices: number;
  profit: number;
  profitMargin: number;
  taskProgress: number;
  taskBreakdown: Record<string, number>;
  wbsCount: number;
  // ERP CORE
  committedCost: number;
  totalExposure: number;
  budgetRemaining: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export type UserRole = PrismaUserRole;

// ============================================
// LABELS & CONSTANTS
// ============================================

export const costType_LABELS: Record<PrismaCostType, string> = {
  material: 'Vật liệu',
  labor: 'Nhân công',
  machine: 'Máy móc',
  subcontract: 'Thầu phụ',
  overhead: 'Chi phí chung',
  other: 'Chi phí khác',
};

export const PAYMENT_STATUS_LABELS: Record<PrismaPaymentStatus, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Đang lập kế hoạch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  ACTIVE: 'Đang hoạt động',
  CLOSED: 'Đã đóng',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang thực hiện',
  REVIEW: 'Đang kiểm tra',
  DONE: 'Hoàn thành',
};

export const INVOICE_STATUS_LABELS: Record<PrismaInvoiceStatus, string> = {
  DRAFT: 'Bản nháp',
  SENT: 'Đã gửi',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
};

export const USER_ROLE_LABELS: Record<PrismaUserRole, string> = {
  SUPER_ADMIN: 'Quản trị viên hệ thống',
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý dự án',
  ACCOUNTANT: 'Kế toán',
  VIEWER: 'Người xem',
  GROUP_DIRECTOR: 'Giám đốc khối',
  CFO: 'Giám đốc tài chính',
  BRANCH_DIRECTOR: 'Giám đốc chi nhánh',
  AUDITOR: 'Kiểm toán viên',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Khởi tạo',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  RESTORE: 'Khôi phục',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  LOCK: 'Khóa',
  UNLOCK: 'Mở khóa',
};

export const ENTITY_LABELS: Record<string, string> = {
  Project: 'Dự án',
  Task: 'Công việc',
  Cost: 'Chi phí',
  Invoice: 'Hóa đơn',
  Payment: 'Thanh toán',
  Budget: 'Dự toán',
  Category: 'Danh mục',
  User: 'Người dùng',
  WBS: 'Hạng mục thi công',
  SYSTEM: 'Hệ thống',
};
