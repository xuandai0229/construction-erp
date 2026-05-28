import { UserRole } from "../generated/prisma-client";
import { ApiError } from "@/lib/api-error";

export type Module =
  | "COST"
  | "REVENUE"
  | "INVOICE"
  | "LEDGER"
  | "VOUCHER"
  | "PAYMENT"
  | "PERIOD"
  | "AUDIT"
  | "REPORT"
  | "PROJECT"
  | "DASHBOARD"
  | "DOCUMENT"
  | "SALARY"
  | "PROFIT"
  | "CASH_FLOW";

export type Action =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "POST"
  | "UNPOST"
  | "REVERSE"
  | "LOCK"
  | "UNLOCK"
  | "CLOSE_PERIOD"
  | "OPEN_PERIOD"
  | "EXPORT"
  | "VIEW_SALARY"
  | "VIEW_PROFIT"
  | "VIEW_CASH_FLOW";

export type EnterpriseRole =
  | "KE_TOAN_CONG_NO"
  | "KE_TOAN_THANH_TOAN"
  | "KE_TOAN_TONG_HOP"
  | "KE_TOAN_TRUONG"
  | "GIAM_DOC"
  | "BAN_KIEM_SOAT"
  | "QUAN_TRI_HE_THONG";

export const ENTERPRISE_ROLE_LABELS: Record<EnterpriseRole, string> = {
  KE_TOAN_CONG_NO: "Kế toán công nợ",
  KE_TOAN_THANH_TOAN: "Kế toán thanh toán",
  KE_TOAN_TONG_HOP: "Kế toán tổng hợp",
  KE_TOAN_TRUONG: "Kế toán trưởng",
  GIAM_DOC: "Giám đốc",
  BAN_KIEM_SOAT: "Ban kiểm soát",
  QUAN_TRI_HE_THONG: "Quản trị hệ thống",
};

export function toEnterpriseRole(role: UserRole): EnterpriseRole {
  switch (role) {
    case "MANAGER":
      return "KE_TOAN_CONG_NO";
    case "BRANCH_DIRECTOR":
      return "KE_TOAN_THANH_TOAN";
    case "ACCOUNTANT":
      return "KE_TOAN_TONG_HOP";
    case "CFO":
      return "KE_TOAN_TRUONG";
    case "GROUP_DIRECTOR":
      return "GIAM_DOC";
    case "AUDITOR":
      return "BAN_KIEM_SOAT";
    case "SUPER_ADMIN":
    case "ADMIN":
      return "QUAN_TRI_HE_THONG";
    default:
      return "BAN_KIEM_SOAT";
  }
}

const CRUD: Action[] = ["CREATE", "READ", "UPDATE", "DELETE"];
const READ_EXPORT: Action[] = ["READ", "EXPORT"];

export const ENTERPRISE_PERMISSION_MATRIX: Record<EnterpriseRole, Partial<Record<Module, Action[]>>> = {
  KE_TOAN_CONG_NO: {
    COST: ["READ"],
    REVENUE: ["CREATE", "READ", "UPDATE"],
    INVOICE: ["CREATE", "READ", "UPDATE"],
    PAYMENT: ["READ"],
    VOUCHER: ["CREATE", "READ", "UPDATE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    REPORT: ["READ", "EXPORT"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ"],
    DOCUMENT: ["CREATE", "READ", "UPDATE"],
  },
  KE_TOAN_THANH_TOAN: {
    COST: ["READ"],
    PAYMENT: ["CREATE", "READ", "UPDATE"],
    VOUCHER: ["CREATE", "READ", "UPDATE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    REPORT: ["READ", "EXPORT"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ"],
    DOCUMENT: ["CREATE", "READ", "UPDATE"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
  KE_TOAN_TONG_HOP: {
    COST: ["CREATE", "READ", "UPDATE"],
    REVENUE: ["CREATE", "READ", "UPDATE"],
    INVOICE: ["CREATE", "READ", "UPDATE"],
    PAYMENT: ["CREATE", "READ", "UPDATE"],
    VOUCHER: ["CREATE", "READ", "UPDATE"],
    LEDGER: ["READ", "POST", "UNPOST", "REVERSE"],
    PERIOD: ["READ"],
    AUDIT: ["READ"],
    REPORT: ["READ", "EXPORT", "VIEW_CASH_FLOW"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ"],
    DOCUMENT: ["CREATE", "READ", "UPDATE"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
  KE_TOAN_TRUONG: {
    COST: ["READ", "APPROVE"],
    REVENUE: ["READ", "APPROVE"],
    INVOICE: ["READ", "APPROVE"],
    PAYMENT: ["READ", "APPROVE"],
    VOUCHER: ["READ", "APPROVE", "POST", "UNPOST"],
    LEDGER: ["READ", "POST", "UNPOST", "REVERSE"],
    PERIOD: ["READ", "LOCK", "UNLOCK", "CLOSE_PERIOD", "OPEN_PERIOD"],
    AUDIT: READ_EXPORT,
    REPORT: ["READ", "EXPORT", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    DOCUMENT: ["READ", "APPROVE"],
    PROFIT: ["READ", "VIEW_PROFIT"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
  GIAM_DOC: {
    COST: ["READ", "APPROVE"],
    REVENUE: ["READ", "APPROVE"],
    INVOICE: ["READ", "APPROVE"],
    PAYMENT: ["READ", "APPROVE"],
    VOUCHER: ["READ", "APPROVE"],
    LEDGER: ["READ"],
    PERIOD: ["READ", "LOCK", "UNLOCK", "CLOSE_PERIOD", "OPEN_PERIOD"],
    AUDIT: READ_EXPORT,
    REPORT: ["READ", "EXPORT", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    PROFIT: ["READ", "VIEW_PROFIT"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
  BAN_KIEM_SOAT: {
    COST: ["READ"],
    REVENUE: ["READ"],
    INVOICE: ["READ"],
    PAYMENT: ["READ"],
    VOUCHER: ["READ"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: READ_EXPORT,
    REPORT: ["READ", "EXPORT", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    PROJECT: ["READ"],
    DASHBOARD: ["READ"],
    DOCUMENT: ["READ"],
    PROFIT: ["READ", "VIEW_PROFIT"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
  QUAN_TRI_HE_THONG: {
    COST: CRUD.concat(["APPROVE", "POST", "UNPOST", "REVERSE"]),
    REVENUE: CRUD.concat(["APPROVE"]),
    INVOICE: CRUD.concat(["APPROVE"]),
    PAYMENT: CRUD.concat(["APPROVE"]),
    VOUCHER: CRUD.concat(["APPROVE", "POST", "UNPOST", "REVERSE"]),
    LEDGER: CRUD.concat(["APPROVE", "POST", "UNPOST", "REVERSE"]),
    PERIOD: ["READ", "LOCK", "UNLOCK", "CLOSE_PERIOD", "OPEN_PERIOD"],
    AUDIT: READ_EXPORT,
    REPORT: ["READ", "EXPORT", "VIEW_SALARY", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    PROJECT: CRUD,
    DASHBOARD: ["READ", "VIEW_SALARY", "VIEW_PROFIT", "VIEW_CASH_FLOW"],
    DOCUMENT: CRUD.concat(["APPROVE"]),
    SALARY: ["READ", "VIEW_SALARY"],
    PROFIT: ["READ", "VIEW_PROFIT"],
    CASH_FLOW: ["READ", "VIEW_CASH_FLOW"],
  },
};

function normalizeAction(action: Action): Action {
  if (action === "REVERSE") return "UNPOST";
  if (action === "LOCK") return "CLOSE_PERIOD";
  if (action === "UNLOCK") return "OPEN_PERIOD";
  return action;
}

export class RBAC {
  static hasPermission(role: UserRole, module: Module, action: Action): boolean {
    const enterpriseRole = toEnterpriseRole(role);
    const allowedActions = ENTERPRISE_PERMISSION_MATRIX[enterpriseRole]?.[module] || [];
    const normalized = normalizeAction(action);
    return allowedActions.includes(action) || allowedActions.includes(normalized);
  }

  static assertPermission(role: UserRole, module: Module, action: Action) {
    if (!this.hasPermission(role, module, action)) {
      const enterpriseRole = toEnterpriseRole(role);
      throw new ApiError(
        403,
        `Vai trò ${ENTERPRISE_ROLE_LABELS[enterpriseRole]} không được phép ${action} trên phân hệ ${module}.`
      );
    }
  }

  static getFinancialLimit(role: UserRole): number {
    const enterpriseRole = toEnterpriseRole(role);
    switch (enterpriseRole) {
      case "KE_TOAN_TRUONG":
        return 50_000_000;
      case "GIAM_DOC":
      case "QUAN_TRI_HE_THONG":
        return Infinity;
      default:
        return 0;
    }
  }

  static assertSegregationOfDuties(creatorId: string | null | undefined, approverId: string | null | undefined) {
    if (creatorId && approverId && creatorId === approverId) {
      throw new ApiError(400, "Người tạo chứng từ không được tự duyệt chứng từ của chính mình.");
    }
  }
}
