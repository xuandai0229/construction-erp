import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class ApprovalAnalyticsService {
  /**
   * Executive Approval Intelligence: Bottleneck detection and latency.
   */
  static async getApprovalSLAStats() {
    const steps = await prisma.approvalStep.findMany({
      where: { status: { in: ['APPROVED', 'REJECTED'] } },
      include: { approver: true }
    });

    const statsByApprover: Record<string, { totalTime: number, count: number }> = {};
    
    steps.forEach(s => {
      if (s.processedAt) {
        const latency = s.processedAt.getTime() - s.createdAt.getTime();
        const name = s.approver.name || "N/A";
        if (!statsByApprover[name]) statsByApprover[name] = { totalTime: 0, count: 0 };
        statsByApprover[name].totalTime += latency;
        statsByApprover[name].count += 1;
      }
    });

    return Object.entries(statsByApprover).map(([name, data]) => ({
      approver: name,
      avgLatencyHours: (data.totalTime / data.count) / (1000 * 60 * 60)
    }));
  }

  /**
   * Executive Overload Detection
   */
  static async getExecutiveWorkload() {
    const pending = await prisma.approvalStep.groupBy({
      by: ['approverId'],
      where: { status: 'PENDING' },
      _count: { id: true }
    });
    return pending;
  }
}

export class GovernancePolicyEngine {
  /**
   * Evaluates complex IF-THEN policies for enterprise governance.
   */
  static async evaluatePolicy(params: {
    amount: Decimal;
    vendorId?: string;
    projectId: string;
    entityType: string;
  }) {
    // Example Policy Logic
    const policies = [];
    
    if (params.amount.gt(1000000000)) { // > 1 Billion
        policies.push({
            rule: "LARGE_EXPENSE_AUDIT",
            action: "REQUIRE_MULTI_SIGN",
            priority: "CRITICAL"
        });
    }

    // Check for "NEW VENDOR" risk
    // (Logic: Check if vendor has < 3 POs)
    
    return policies;
  }
}
