import { UserRole } from "../generated/prisma-client";

export class EnterprisePolicyIntelligenceService {
  /**
   * Validates if a recommended action violates enterprise governance.
   */
  static validateAction(role: UserRole, action: string) {
    const restrictedActions = ["DELETE_PROJECT", "APPROVE_LARGE_INVOICE"];
    
    if (role === UserRole.VIEWER && restrictedActions.includes(action)) {
      return {
        allowed: false,
        reason: "POLICY_VIOLATION: Viewer role cannot perform destructive or high-value financial actions."
      };
    }

    return { allowed: true };
  }

  static getCorePolicies() {
    return [
      "P1: All financial mutations require Manager/Admin approval.",
      "P2: Multi-company data must be isolated (Tenant Safety).",
      "P3: Audit Trail must be immutable and comprehensive."
    ];
  }
}
