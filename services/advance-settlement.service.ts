import { PrismaClient, SettlementStatus } from "../generated/prisma-client";
import { AdvanceSettlementPolicy } from "../lib/accounting/advanceSettlementPolicy";
import { AuditService } from "./audit.service";


const prisma = new PrismaClient();

export class AdvanceSettlementService {
  static async createSettlement(data: any, userId: string, companyId?: string) {
    return prisma.$transaction(async (tx) => {
      const advance = await tx.advanceRequest.findUnique({ where: { id: data.advanceRequestId } });
      if (!advance) throw new Error("Advance not found");

      let invoiceRemaining = 999999999;
      let invoiceStatus = "APPROVED"; // Mocking for now, normally fetch invoice

      if (data.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId }, include: { contract: true } });
        if (!invoice) throw new Error("Invoice not found");
        invoiceRemaining = Number(invoice.remainingAmount);
        invoiceStatus = invoice.approvalStatus;

        AdvanceSettlementPolicy.validateOffset(advance, invoice, false);
      }

      AdvanceSettlementPolicy.validateSettlement(
        advance.status, 
        invoiceStatus, 
        data.amount, 
        Number(advance.remainingAmount), 
        invoiceRemaining
      );

      const settlement = await tx.advanceSettlement.create({
        data: {
          ...data,
          status: "DRAFT",
          createdBy: userId,
          companyId: companyId || advance.companyId,
        }
      });

      await AuditService.log({
        userId,
        action: "CREATE",
        entity: "AdvanceSettlement",
        entityId: settlement.id,
        newData: settlement,
      });

      return settlement;
    });
  }

  static async submitSettlement(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.advanceSettlement.findUnique({ where: { id } });
      if (!doc) throw new Error("Not found");
      if (doc.status !== "DRAFT") throw new Error("Must be DRAFT");

      const updated = await tx.advanceSettlement.update({
        where: { id },
        data: { status: "SUBMITTED" }
      });

      await AuditService.log({ userId, action: "SUBMIT", entity: "AdvanceSettlement", entityId: id, newData: updated });
      return updated;
    });
  }

  static async approveSettlement(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.advanceSettlement.findUnique({ where: { id } });
      if (!doc) throw new Error("Not found");
      if (doc.status !== "SUBMITTED") throw new Error("Must be SUBMITTED");
      if (doc.createdBy === userId) throw new Error("Cannot self-approve");

      const updated = await tx.advanceSettlement.update({
        where: { id },
        data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() }
      });

      await AuditService.log({ userId, action: "APPROVE", entity: "AdvanceSettlement", entityId: id, newData: updated });
      return updated;
    });
  }

  static async postSettlement(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.advanceSettlement.findUnique({ where: { id }, include: { advanceRequest: true } });
      if (!doc) throw new Error("Not found");
      if (doc.status !== "APPROVED") throw new Error("Must be APPROVED");

      const advance = doc.advanceRequest;
      const amount = Number(doc.amount);

      const newSettledAmount = Number(advance.settledAmount) + amount;
      const newRemainingAmount = Number(advance.paidAmount) - newSettledAmount;
      const newStatus = newRemainingAmount <= 0 ? "FULLY_SETTLED" : "PARTIALLY_SETTLED";

      await tx.advanceRequest.update({
        where: { id: advance.id },
        data: {
          settledAmount: newSettledAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus
        }
      });

      const updated = await tx.advanceSettlement.update({
        where: { id },
        data: { status: "POSTED" }
      });

      await AuditService.log({ userId, action: "POST", entity: "AdvanceSettlement", entityId: id, newData: updated });
      return updated;
    });
  }

  static async reverseSettlement(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.advanceSettlement.findUnique({ where: { id }, include: { advanceRequest: true } });
      if (!doc) throw new Error("Not found");

      const updated = await tx.advanceSettlement.update({
        where: { id },
        data: { status: "REVERSED" }
      });

      if (doc.status === "POSTED") {
        const advance = doc.advanceRequest;
        const amount = Number(doc.amount);
        const newSettledAmount = Number(advance.settledAmount) - amount;
        const newRemainingAmount = Number(advance.paidAmount) - newSettledAmount;
        const newStatus = newRemainingAmount >= Number(advance.paidAmount) ? "PAID" : "PARTIALLY_SETTLED";

        await tx.advanceRequest.update({
          where: { id: advance.id },
          data: {
            settledAmount: newSettledAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus
          }
        });
      }

      await AuditService.log({ userId, action: "REVERSE", entity: "AdvanceSettlement", entityId: id, newData: updated });
      return updated;
    });
  }
}
