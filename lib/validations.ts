import { z } from "zod";
import { ProjectStatus, TaskStatus, CostType, PaymentStatus, InvoiceStatus, UserRole } from "@prisma/client";

// ─────────────────────────────────────────────
// PROJECT
// ─────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Tên dự án là bắt buộc").max(255),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.PLANNED),
  ownerId: z.string().uuid("Invalid Owner ID").optional(),
  contractValue: z.number().nonnegative("Giá trị hợp đồng không được âm").optional().default(0),
  totalBudget: z.number().nonnegative("Tổng dự toán không được âm").optional().default(0),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;

// ─────────────────────────────────────────────
// TASK
// ─────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Tên công việc là bắt buộc").max(255),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  projectId: z.string().uuid("Invalid Project ID"),
  categoryId: z.string().uuid("Invalid Category ID").optional(),
  assigneeId: z.string().uuid("Invalid Assignee ID").optional(),
  dueDate: z.string().optional(),
  priority: z.number().int().min(0).max(2).optional().default(0),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;

// ─────────────────────────────────────────────
// WBS
// ─────────────────────────────────────────────

export const createWBSSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Tên hạng mục là bắt buộc").max(255),
  code: z.string().max(50).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export type CreateWBSDTO = z.infer<typeof createWBSSchema>;

export const updateWBSSchema = createWBSSchema.partial().omit({ projectId: true });
export type UpdateWBSDTO = z.infer<typeof updateWBSSchema>;

// ─────────────────────────────────────────────
// COST
// ─────────────────────────────────────────────

export const createCostSchema = z.object({
  projectId: z.string().uuid("Dự án là bắt buộc"),
  wbsId: z.string().uuid("Hạng mục WBS là bắt buộc"),
  costType: z.nativeEnum(CostType).default(CostType.material),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  quantity: z.number().positive("Số lượng phải lớn hơn 0").optional(),
  unitPrice: z.number().nonnegative("Đơn giá không được âm").optional(),
  supplier: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
  date: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.unpaid),
  createdById: z.string().uuid().optional(),
});

export type CreateCostDTO = z.infer<typeof createCostSchema>;

export const updateCostSchema = createCostSchema.partial().omit({ projectId: true });
export type UpdateCostDTO = z.infer<typeof updateCostSchema>;

// ─────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────

export const createBudgetSchema = z.object({
  projectId: z.string().uuid("Dự án là bắt buộc"),
  wbsId: z.string().uuid("Hạng mục WBS là bắt buộc"),
  costType: z.nativeEnum(CostType).default(CostType.material),
  estimatedAmount: z.number().positive("Dự toán phải lớn hơn 0"),
  createdById: z.string().uuid().optional(),
});

export type CreateBudgetDTO = z.infer<typeof createBudgetSchema>;

// ─────────────────────────────────────────────
// REVENUE
// ─────────────────────────────────────────────

export const createRevenueSchema = z.object({
  projectId: z.string().uuid("Dự án là bắt buộc"),
  wbsId: z.string().uuid("Hạng mục WBS là bắt buộc"),
  invoiceId: z.string().uuid().nullable().optional(),
  amount: z.number().positive("Doanh thu phải lớn hơn 0"),
  date: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.unpaid),
  description: z.string().max(1000).optional(),
  createdById: z.string().uuid().optional(),
});

export type CreateRevenueDTO = z.infer<typeof createRevenueSchema>;

export const updateRevenueSchema = createRevenueSchema.partial().omit({ projectId: true });
export type UpdateRevenueDTO = z.infer<typeof updateRevenueSchema>;

// ─────────────────────────────────────────────
// INVOICE
// ─────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  projectId: z.string().uuid("Dự án là bắt buộc"),
  wbsId: z.string().uuid("Hạng mục WBS là bắt buộc"),
  invoiceNumber: z.string().max(100).optional(),
  amount: z.number().positive("Giá trị hóa đơn phải lớn hơn 0"),
  issuedDate: z.string().optional(),
  dueDate: z.string().optional(),
  note: z.string().max(1000).optional(),
  status: z.nativeEnum(InvoiceStatus).optional().default(InvoiceStatus.DRAFT),
  createdById: z.string().uuid().optional(),
});

export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;

// ─────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────

export const createPaymentSchema = z.object({
  projectId: z.string().uuid("Dự án là bắt buộc"),
  invoiceId: z.string().uuid("Hóa đơn là bắt buộc"),
  amount: z.number().positive("Số tiền thanh toán phải lớn hơn 0"),
  date: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;

// ─────────────────────────────────────────────
// QUERY PARAMS — reusable pagination/filter
// ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
});

export const projectFilterSchema = paginationSchema.extend({
  projectId: z.string().uuid().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderBy: z.enum(["createdAt", "date", "amount", "name"]).optional().default("createdAt"),
  orderDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProjectFilterDTO = z.infer<typeof projectFilterSchema>;
