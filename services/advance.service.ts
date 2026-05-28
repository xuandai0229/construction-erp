import { PrismaClient, AdvanceStatus } from "../generated/prisma-client";
import { AdvanceSettlementPolicy } from "../lib/accounting/advanceSettlementPolicy";
import { AuditService } from "./audit.service";


const prisma = new PrismaClient();

export class AdvanceService {
  static async createAdvance(data: any, userId: string, companyId?: string) {
    AdvanceSettlementPolicy.validateAdvanceCreate(data);

    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.create({
        data: {
          ...data,
          status: "DRAFT",
          paidAmount: 0,
          settledAmount: 0,
          remainingAmount: data.amount,
          requestedBy: userId,
          companyId: companyId || data.companyId,
        }
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "AdvanceRequest",
        entityId: advance.id,
        newData: advance,
      });

      return advance;
    });
  }

  static async submitAdvance(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.findUnique({ where: { id } });
      if (!advance) throw new Error("Not found");
      
      if (advance.status !== "DRAFT") {
        throw new Error("Chỉ DRAFT mới được submit");
      }
      
      const updated = await tx.advanceRequest.update({
        where: { id },
        data: { status: "SUBMITTED" }
      });

      await AuditService.log({
        userId,
        action: "SUBMIT",
        entity: "AdvanceRequest",
        entityId: id,
        newData: updated,
      });

      return updated;
    });
  }

  static async approveAdvance(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.findUnique({ where: { id } });
      if (!advance) throw new Error("Not found");

      AdvanceSettlementPolicy.validateAdvanceApprove(advance.status, advance.requestedBy === userId);

      const updated = await tx.advanceRequest.update({
        where: { id },
        data: { 
          status: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date()
        }
      });

      await AuditService.log({
        userId,
        action: "APPROVE",
        entity: "AdvanceRequest",
        entityId: id,
        newData: updated,
      });

      return updated;
    });
  }

  static async postAdvancePayment(id: string, userId: string, journalEntryId?: string) {
    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.findUnique({ where: { id } });
      if (!advance) throw new Error("Not found");

      AdvanceSettlementPolicy.validateAdvancePaymentPost(advance.status, false); // Mock period lock = false for now

      const updated = await tx.advanceRequest.update({
        where: { id },
        data: { 
          status: "PAID",
          paidAmount: advance.amount,
          remainingAmount: advance.amount,
          paidAt: new Date(),
          postedJournalEntryId: journalEntryId
        }
      });

      await AuditService.log({
        userId,
        action: "POST_PAYMENT",
        entity: "AdvanceRequest",
        entityId: id,
        newData: updated,
      });

      return updated;
    });
  }

  static async reverseAdvance(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.findUnique({ where: { id } });
      if (!advance) throw new Error("Not found");

      const updated = await tx.advanceRequest.update({
        where: { id },
        data: { status: "REVERSED" }
      });

      await AuditService.log({
        userId,
        action: "REVERSE",
        entity: "AdvanceRequest",
        entityId: id,
        newData: updated,
      });

      return updated;
    });
  }
}
