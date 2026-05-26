import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ContractStatus } from "@prisma/client";
import { AuditService } from "./audit.service";
import { round } from "@/lib/math";

export class ContractService {
  
  static async createContract(data: {
    projectId: string;
    title: string;
    contractNumber?: string;
    originalValue: number;
    contractorName?: string;
    createdById?: string;
  }) {
    const { assertPeriodNotLocked } = await import("@/lib/period");
    await assertPeriodNotLocked(new Date());

    const value = round(data.originalValue);

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          projectId: data.projectId,
          title: data.title,
          contractNumber: data.contractNumber,
          originalValue: value,
          currentValue: value,
          contractorName: data.contractorName,
          status: ContractStatus.ACTIVE,
          createdById: data.createdById
        }
      });

      // Update project contract value baseline
      await tx.project.update({
        where: { id: data.projectId },
        data: { contractValue: value }
      });

      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "Contract",
        entityId: contract.id,
        newData: contract
      });

      return contract;
    });
  }

  static async createVariationOrder(data: {
    contractId: string;
    title: string;
    changeAmount: number;
    description?: string;
  }) {
    const { assertPeriodNotLocked } = await import("@/lib/period");
    await assertPeriodNotLocked(new Date());

    const amount = round(data.changeAmount);

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: data.contractId }
      });

      if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng");

      const vo = await tx.contractChange.create({
        data: {
          contractId: data.contractId,
          title: data.title,
          description: data.description,
          changeAmount: amount,
          status: "APPROVED" // Assuming auto-approval for now as per "Real ERP" speed
        }
      });

      const newTotal = round(Number(contract.currentValue) + amount);

      await tx.contract.update({
        where: { id: contract.id },
        data: { currentValue: newTotal }
      });

      // Sync project baseline
      await tx.project.update({
        where: { id: contract.projectId },
        data: { contractValue: newTotal }
      });

      await AuditService.log({
        action: "CREATE",
        entity: "ContractChange",
        entityId: vo.id,
        newData: vo
      });

      return vo;
    });
  }

  static async findByProject(projectId: string) {
    return prisma.contract.findMany({
      where: { projectId },
      include: { changes: true },
      orderBy: { createdAt: "desc" }
    });
  }
}
