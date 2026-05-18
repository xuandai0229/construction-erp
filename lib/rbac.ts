import { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api-error";

export type Module = "COST" | "REVENUE" | "INVOICE" | "LEDGER" | "PERIOD" | "AUDIT" | "REPORT";
export type Action = "READ" | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "POST" | "REVERSE" | "LOCK" | "UNLOCK" | "EXPORT";

// Authoritative Centralized Permission Matrix
const PERMISSION_MATRIX: Record<UserRole, Partial<Record<Module, Action[]>>> = {
  SUPER_ADMIN: {
    COST: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "POST", "REVERSE"],
    REVENUE: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE"],
    INVOICE: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE"],
    LEDGER: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "POST", "REVERSE"],
    PERIOD: ["READ", "LOCK", "UNLOCK"],
    AUDIT: ["READ", "EXPORT"],
    REPORT: ["READ", "EXPORT"]
  },
  ADMIN: {
    COST: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "POST", "REVERSE"],
    REVENUE: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE"],
    INVOICE: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE"],
    LEDGER: ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "POST", "REVERSE"],
    PERIOD: ["READ", "LOCK", "UNLOCK"],
    AUDIT: ["READ", "EXPORT"],
    REPORT: ["READ", "EXPORT"]
  },
  CFO: {
    COST: ["READ", "CREATE", "UPDATE", "APPROVE", "POST", "REVERSE"],
    REVENUE: ["READ", "CREATE", "UPDATE", "APPROVE"],
    INVOICE: ["READ", "CREATE", "UPDATE", "APPROVE"],
    LEDGER: ["READ", "POST", "REVERSE"],
    PERIOD: ["READ", "LOCK", "UNLOCK"],
    AUDIT: ["READ"],
    REPORT: ["READ", "EXPORT"]
  },
  ACCOUNTANT: {
    COST: ["READ", "CREATE", "UPDATE"],
    REVENUE: ["READ", "CREATE", "UPDATE"],
    INVOICE: ["READ", "CREATE", "UPDATE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: ["READ"],
    REPORT: ["READ"]
  },
  MANAGER: {
    COST: ["READ", "CREATE", "UPDATE", "APPROVE"],
    REVENUE: ["READ", "CREATE", "UPDATE", "APPROVE"],
    INVOICE: ["READ", "CREATE", "UPDATE", "APPROVE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: [],
    REPORT: ["READ"]
  },
  BRANCH_DIRECTOR: {
    COST: ["READ", "APPROVE"],
    REVENUE: ["READ", "APPROVE"],
    INVOICE: ["READ", "APPROVE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: [],
    REPORT: ["READ"]
  },
  GROUP_DIRECTOR: {
    COST: ["READ", "APPROVE"],
    REVENUE: ["READ", "APPROVE"],
    INVOICE: ["READ", "APPROVE"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: ["READ"],
    REPORT: ["READ", "EXPORT"]
  },
  AUDITOR: {
    COST: ["READ"],
    REVENUE: ["READ"],
    INVOICE: ["READ"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: ["READ", "EXPORT"],
    REPORT: ["READ", "EXPORT"]
  },
  VIEWER: {
    COST: ["READ"],
    REVENUE: ["READ"],
    INVOICE: ["READ"],
    LEDGER: ["READ"],
    PERIOD: ["READ"],
    AUDIT: [],
    REPORT: ["READ"]
  }
};

export class RBAC {
  /**
   * Verify if a role is permitted to perform an action on a module
   */
  static hasPermission(role: UserRole, module: Module, action: Action): boolean {
    const allowedActions = PERMISSION_MATRIX[role]?.[module];
    return allowedActions?.includes(action) ?? false;
  }

  /**
   * Enforces module-level action permission, throwing ApiError if forbidden
   */
  static assertPermission(role: UserRole, module: Module, action: Action) {
    if (!this.hasPermission(role, module, action)) {
      throw new ApiError(
        403,
        `Quyền hạn tối thiểu không đáp ứng. Vai trò ${role} không được phép thực hiện hành động ${action} trên phân hệ ${module}.`
      );
    }
  }

  /**
   * Get financial authority transaction limit (in VND) for a role
   */
  static getFinancialLimit(role: UserRole): number {
    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
      case "CFO":
      case "GROUP_DIRECTOR":
        return Infinity; // Unlimited
      case "BRANCH_DIRECTOR":
        return 500000000; // 500,000,000 VND
      case "MANAGER":
        return 100000000; // 100,000,000 VND
      case "ACCOUNTANT":
        return 0; // Accountants can only create/update drafts, not authorize/post
      default:
        return 0;
    }
  }

  /**
   * Enforce Segregation of Duties (SoD) (Batch 6.5)
   * A user who created a record cannot approve it!
   */
  static assertSegregationOfDuties(creatorId: string | null | undefined, approverId: string | null | undefined) {
    if (creatorId && approverId && creatorId === approverId) {
      throw new ApiError(
        400,
        "Nguyên tắc kiểm soát nội bộ (Segregation of Duties): Người tạo chứng từ không được phép tự phê duyệt chứng từ của chính mình."
      );
    }
  }
}
