import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { UserRole } from "@prisma/client";

export class DOAService {
  /**
   * Enterprise Delegation of Authority (DOA) Resolver.
   * Resolves who has the authority to approve a specific amount.
   */
  static async resolveAuthority(params: {
    amount: Decimal;
    entityType: string;
    projectId: string;
  }) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { status: true }
    });

    // 1. Fetch Authority Matrix
    const matrix = await prisma.authorityMatrix.findMany({
      where: { entityType: params.entityType },
      orderBy: { maxAmount: 'asc' }
    });

    // 2. Find minimum required role that covers the amount
    const requiredRole = matrix.find(m => m.maxAmount.gte(params.amount));
    
    // 3. Check for active delegations (Vacation/Emergency)
    const activeDelegations = await prisma.delegationWindow.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { delegate: true, owner: true }
    });

    return {
      requiredRole: requiredRole?.role || UserRole.ADMIN,
      isHighRisk: params.amount.gt(new Decimal(2000000000)), // > 2 Billion
      delegations: activeDelegations
    };
  }

  /**
   * P3: Temporary & Emergency Delegation
   */
  static async createDelegation(params: {
    ownerId: string;
    delegateId: string;
    start: Date;
    end: Date;
    reason: string;
  }) {
    return prisma.delegationWindow.create({
      data: {
        ownerId: params.ownerId,
        delegateId: params.delegateId,
        startDate: params.start,
        endDate: params.end,
        reason: params.reason
      }
    });
  }
}

export class ApprovalRoutingEngine {
  /**
   * Dynamic Approval Routing based on enterprise policies.
   */
  static async getRoutingPath(params: {
    projectId: string;
    amount: Decimal;
    entityType: string;
    metadata?: any;
  }) {
    const { requiredRole, isHighRisk } = await DOAService.resolveAuthority(params);
    
    const path = [];

    // Step 1: Standard Operational Approval (e.g. QS/PM)
    path.push({ role: UserRole.MANAGER, stepOrder: 1 });

    // Step 2: Financial/Authority Approval based on DOA
    if (requiredRole !== UserRole.MANAGER) {
      path.push({ role: requiredRole, stepOrder: 2 });
    }

    // Step 3: High-Risk Escalation (CFO/Director)
    if (isHighRisk || params.metadata?.vendorRisk === 'HIGH') {
      path.push({ role: UserRole.ADMIN, stepOrder: 3, label: "EXECUTIVE AUDIT" });
    }

    return path;
  }
}
