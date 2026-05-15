import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CreateBudgetDTO } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";

export class BudgetService {
  static async create(data: CreateBudgetDTO) {
    assertValidEntity(data, "CreateBudgetDTO");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    const wbs = await prisma.wBSItem.findUnique({ where: { id: data.wbsId } });
    if (!wbs) throw new ApiError(404, "Không tìm thấy hạng mục WBS");
    if (wbs.projectId !== data.projectId) throw new ApiError(400, "Hạng mục WBS không thuộc về dự án đã chọn");

    const amount = Math.round((data.estimatedAmount + Number.EPSILON) * 100) / 100;

    const budget = await prisma.budgetRecord.create({
      data: {
        projectId: data.projectId,
        wbsId: data.wbsId,
        costType: data.costType,
        estimatedAmount: amount,
        createdById: data.createdById,
      },
    });

    // Trigger self-healing sync in ProjectService
    const { ProjectService } = require("./project.service");
    await ProjectService.getAccountingSummary(data.projectId);

    return budget;
  }

  static async findByProject(projectId: string) {
    return prisma.budgetRecord.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.budgetRecord.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy dự toán");
    const deleted = await prisma.budgetRecord.update({ 
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    // Trigger self-healing sync in ProjectService
    const { ProjectService } = require("./project.service");
    await ProjectService.getAccountingSummary(existing.projectId);
    
    return deleted;
  }
}
