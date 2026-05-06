import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { round } from "@/lib/math";
import { PostingEngine } from "@/lib/accounting/postingEngine";
import { AuditService } from "./audit.service";

export class CostService {
  static async create(data: CreateCostDTO) {
    assertValidEntity(data, "CreateCostDTO");

    // 1. Validate Project existence
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    // 2. Validate WBS existence and ownership
    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) {
      throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");
    }

    const roundedAmount = round(data.amount);

    return prisma.$transaction(async (tx) => {
      // Cost Control Logic: Warning if cost > budget
      const budget = await tx.budgetRecord.aggregate({
        where: { wbsId: data.wbsId },
        _sum: { estimatedAmount: true }
      });

      const existingCosts = await tx.costRecord.aggregate({
        where: { wbsId: data.wbsId },
        _sum: { amount: true }
      });

      const totalBudget = budget._sum?.estimatedAmount ? Number(budget._sum.estimatedAmount) : 0;
      const currentCosts = existingCosts._sum?.amount ? Number(existingCosts._sum.amount) : 0;
      const totalCostsAfter = round(currentCosts + roundedAmount);

      if (totalBudget > 0 && totalCostsAfter > totalBudget) {
        console.warn(`WARNING: Cost overrun for WBS ${data.wbsId}. Budget: ${totalBudget}, Actual: ${totalCostsAfter}`);
      }

      // 3. Create Cost Record
      const item = await tx.costRecord.create({
        data: {
          projectId: data.projectId,
          wbsId: data.wbsId,
          costType: data.costType,
          amount: roundedAmount,
          quantity: data.quantity ?? 1,
          unitPrice: data.unitPrice ?? 0,
          supplier: data.supplier,
          note: data.note,
          date: data.date ? new Date(data.date) : new Date(),
          status: data.status,
          createdById: data.createdById
        }
      });

      // 4. Posting to Ledger (Double Entry)
      await PostingEngine.postCost(tx, {
        costId: item.id,
        projectId: item.projectId,
        amount: roundedAmount,
        costType: item.costType,
        description: item.note || `Chi phí ${item.costType} cho ${wbs.name}`
      });

      // 5. Audit Logging
      await AuditService.log({
        userId: data.createdById,
        action: "CREATE",
        entity: "CostRecord",
        entityId: item.id,
        newData: item
      });

      return item;
    });
  }

  static async findByProject(projectId: string, filters: any = {}) {
    const { costType, status, startDate, endDate } = filters;
    
    return prisma.costRecord.findMany({
      where: {
        projectId,
        ...(costType && { costType }),
        ...(status && { status }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      orderBy: { date: "desc" },
      include: {
        wbs: { select: { name: true } }
      }
    });
  }

  static async delete(id: string) {
    const existing = await prisma.costRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy chi phí");

    return prisma.$transaction(async (tx) => {
      // Logic for reversing posting could be added here if needed for full compliance
      await AuditService.log({
        action: "DELETE",
        entity: "CostRecord",
        entityId: id,
        oldData: existing
      });
      return tx.costRecord.delete({ where: { id } });
    });
  }
}
