import { UserRole } from "../../generated/prisma-client";
import { ApiError } from "@/lib/api-error";
import { toEnterpriseRole } from "@/lib/rbac";

export type PaymentApprovalStep = "KE_TOAN_TRUONG" | "GIAM_DOC";

export type PaymentApprovalPolicy = {
  maxAmountExclusive?: number;
  minAmountInclusive?: number;
  requiredSteps: PaymentApprovalStep[];
};

export const DEFAULT_PAYMENT_APPROVAL_POLICIES: PaymentApprovalPolicy[] = [
  { maxAmountExclusive: 50_000_000, requiredSteps: ["KE_TOAN_TRUONG"] },
  { minAmountInclusive: 50_000_000, maxAmountExclusive: 500_000_000, requiredSteps: ["KE_TOAN_TRUONG", "GIAM_DOC"] },
  { minAmountInclusive: 500_000_000, requiredSteps: ["GIAM_DOC"] },
];

export class PaymentApprovalGovernance {
  static getRequiredSteps(amount: number, policies = DEFAULT_PAYMENT_APPROVAL_POLICIES): PaymentApprovalStep[] {
    const policy = policies.find(item => {
      const aboveMin = item.minAmountInclusive === undefined || amount >= item.minAmountInclusive;
      const belowMax = item.maxAmountExclusive === undefined || amount < item.maxAmountExclusive;
      return aboveMin && belowMax;
    });
    return policy?.requiredSteps || ["GIAM_DOC"];
  }

  static assertRoleCanApprovePayment(role: UserRole, amount: number) {
    const enterpriseRole = toEnterpriseRole(role);
    const requiredSteps = this.getRequiredSteps(amount);
    if (!requiredSteps.includes(enterpriseRole as PaymentApprovalStep)) {
      throw new ApiError(403, `Vai trò hiện tại không thuộc luồng duyệt thanh toán ${amount.toLocaleString("vi-VN")} VND.`);
    }
    return requiredSteps;
  }
}
