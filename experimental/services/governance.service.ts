import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ChangeType, ClaimType, ApprovalStatus, CommitmentType } from "@/generated/prisma-client";
import { CPMEngine } from "./cpm-engine.service";

/**
 * Contract Governance & Claims Engine
 * Handles Variations, Change Orders, Extensions of Time (EOT), and Commitment Accounting.
 */
export class ContractGovernanceService {

  // ═══════════════════════════════════════════════════════════════
  // CHANGE REQUESTS & VARIATIONS
  // ═══════════════════════════════════════════════════════════════

  static async createChangeRequest(data: {
    projectId: string;
    title: string;
    description: string;
    type: ChangeType;
    costImpact: number;
    scheduleImpact: number; // days
    requestedById: string;
  }) {
    return prisma.changeRequest.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        type: data.type,
        costImpact: data.costImpact,
        scheduleImpact: data.scheduleImpact,
        requestedById: data.requestedById,
        status: ApprovalStatus.DRAFT,
      }
    });
  }

  static async approveChangeRequest(changeRequestId: string, approvedById: string) {
    const cr = await prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
    if (!cr) throw new ApiError(404, "Change Request not found");
    if (cr.status === ApprovalStatus.APPROVED) throw new ApiError(400, "Already approved");

    // 1. Approve the Change Request
    const approvedCR = await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedById,
        approvedDate: new Date(),
      }
    });

    // 2. Adjust Project Budget automatically
    if (Number(cr.costImpact) > 0) {
      await prisma.project.update({
        where: { id: cr.projectId },
        data: {
          totalBudget: { increment: cr.costImpact }
        }
      });
    }

    return approvedCR;
  }

  // ═══════════════════════════════════════════════════════════════
  // CLAIMS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  static async submitClaim(data: {
    projectId: string;
    changeRequestId?: string;
    type: ClaimType;
    title: string;
    description: string;
    claimedAmount: number;
    claimedDays: number;
    evidence?: string;
  }) {
    return prisma.claimRecord.create({
      data: {
        projectId: data.projectId,
        changeRequestId: data.changeRequestId,
        type: data.type,
        title: data.title,
        description: data.description,
        claimedAmount: data.claimedAmount,
        claimedDays: data.claimedDays,
        evidence: data.evidence,
        status: ApprovalStatus.PENDING,
        submittedDate: new Date(),
      }
    });
  }

  static async resolveClaim(data: {
    claimId: string;
    status: ApprovalStatus; // APPROVED or REJECTED
    approvedAmount: number;
    approvedDays: number;
  }) {
    const claim = await prisma.claimRecord.findUnique({ where: { id: data.claimId } });
    if (!claim) throw new ApiError(404, "Claim not found");

    const resolvedClaim = await prisma.claimRecord.update({
      where: { id: data.claimId },
      data: {
        status: data.status,
        approvedAmount: data.approvedAmount,
        approvedDays: data.approvedDays,
        resolvedDate: new Date(),
      }
    });

    // If EOT (Extension of Time) is approved, inject a DelayEvent to adjust CPM Schedule
    if (data.status === ApprovalStatus.APPROVED && data.approvedDays > 0) {
      // Find a milestone or project finish activity to apply EOT
      const endActivity = await prisma.activity.findFirst({
        where: { projectId: claim.projectId, isMilestone: true, deletedAt: null },
        orderBy: { plannedFinish: 'desc' }
      });

      if (endActivity) {
        await CPMEngine.recordDelay({
          activityId: endActivity.id,
          projectId: claim.projectId,
          category: "CLIENT_INSTRUCTION",
          description: `EOT Claim Approved: ${claim.title}`,
          delayDays: data.approvedDays,
          isExcusable: true,
          isCompensable: claim.type === ClaimType.DELAY_COST,
        });
      }
    }

    return resolvedClaim;
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMITMENT ACCOUNTING & FUTURE OBLIGATIONS
  // ═══════════════════════════════════════════════════════════════

  static async registerCommitment(data: {
    projectId: string;
    type: CommitmentType;
    reference: string;
    sourceId: string;
    description: string;
    originalAmount: number;
    dueDate?: Date;
  }) {
    return prisma.commitment.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        reference: data.reference,
        sourceId: data.sourceId,
        description: data.description,
        originalAmount: data.originalAmount,
        remainingAmount: data.originalAmount, // initially 100% remaining
        dueDate: data.dueDate,
        status: "OPEN",
      }
    });
  }

  static async drawdownCommitment(commitmentId: string, invoicedAmount: number) {
    const commitment = await prisma.commitment.findUnique({ where: { id: commitmentId } });
    if (!commitment) throw new ApiError(404, "Commitment not found");

    const newInvoiced = Number(commitment.invoicedAmount) + invoicedAmount;
    const newRemaining = Math.max(0, Number(commitment.originalAmount) - newInvoiced);

    const status = newRemaining <= 0 ? "FULLY_INVOICED" : "PARTIALLY_INVOICED";

    return prisma.commitment.update({
      where: { id: commitmentId },
      data: {
        invoicedAmount: newInvoiced,
        remainingAmount: newRemaining,
        status,
      }
    });
  }

  /**
   * Forecast Future Cash Obligations based on Commitments
   */
  static async forecastObligations(projectId: string) {
    const commitments = await prisma.commitment.findMany({
      where: {
        projectId,
        status: { in: ["OPEN", "PARTIALLY_INVOICED"] }
      }
    });

    let totalRemaining = 0;
    const breakdown = {
      PROCUREMENT: 0,
      SUBCONTRACT: 0,
      PAYROLL: 0,
      EQUIPMENT: 0,
      RETENTION: 0,
    };

    for (const c of commitments) {
      const amount = Number(c.remainingAmount);
      totalRemaining += amount;

      switch (c.type) {
        case CommitmentType.PURCHASE_ORDER: breakdown.PROCUREMENT += amount; break;
        case CommitmentType.SUBCONTRACT: breakdown.SUBCONTRACT += amount; break;
        case CommitmentType.PAYROLL: breakdown.PAYROLL += amount; break;
        case CommitmentType.EQUIPMENT_LEASE: breakdown.EQUIPMENT += amount; break;
        case CommitmentType.RETENTION: breakdown.RETENTION += amount; break;
      }
    }

    return {
      totalFutureObligations: totalRemaining,
      breakdown,
      activeCommitmentsCount: commitments.length,
    };
  }
}
