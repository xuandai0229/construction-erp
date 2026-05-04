import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateCostDTO } from "@/lib/validations";

export class CostService {
  static async create(data: CreateCostDTO) {
    // Cost Control Logic: Warning if cost > budget
    const budget = await prisma.budgetRecord.aggregate({
      where: { wbs_id: data.wbsId },
      _sum: { estimated_amount: true }
    });

    const existingCosts = await prisma.costRecord.aggregate({
      where: { wbs_id: data.wbsId },
      _sum: { amount: true }
    });

    const totalBudget = budget._sum?.estimated_amount || 0;
    const totalCosts = (existingCosts._sum?.amount || 0) + data.amount;

    if (totalBudget > 0 && totalCosts > totalBudget) {
      console.warn(`WARNING: Cost overrun for WBS ${data.wbsId}. Budget: ${totalBudget}, Actual: ${totalCosts}`);
    }

    return prisma.costRecord.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId,
        cost_type: data.costType,
        amount: data.amount,
        quantity: data.quantity ?? 1,
        unit_price: data.unitPrice ?? 0,
        supplier: data.supplier,
        note: data.note,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status,
        created_by_id: data.createdById
      }
    });
  }

  static async findByProject(project_id: string, filters: any = {}) {
    const { costType, status, startDate, endDate } = filters;
    
    return prisma.costRecord.findMany({
      where: {
        project_id,
        ...(costType && { cost_type: costType }),
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
}
