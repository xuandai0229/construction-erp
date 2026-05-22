import { prisma } from "@/lib/prisma";
import { FinancialAggregationService } from "./financial-aggregation.service";
import { ApiError } from "@/lib/api-error";
import { CreateWBSDTO, UpdateWBSDTO } from "@/lib/validations";
import { AuditService } from "./audit.service";
import { eventBus } from "@/lib/event-bus";

export class WBSService {
  static async findByProject(projectId: string) {
    const result = await FinancialAggregationService.getWBSAggregation(projectId);
    const { tree, stats } = result;

    // Maintain flat list for exports/legacy use
    const items = await prisma.wBSItem.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    return {
      tree,
      flat: items,
      stats: {
        totalItems: items.length,
        ...stats
      },
    };
  }

  static async create(data: CreateWBSDTO, userId?: string) {
    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new ApiError(404, "Không tìm thấy dự án");

    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
      if (parent.projectId !== data.projectId) throw new ApiError(400, "Hạng mục cha phải thuộc cùng một dự án");
    }

    let level = 0;
    if (data.parentId) {
      const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
      
      level = parent.level + 1;

      // Hierarchical Code Validation
      if (data.code && parent.code) {
        if (!data.code.startsWith(parent.code)) {
          throw new ApiError(400, `Mã hạng mục con (${data.code}) phải bắt đầu bằng tiền tố của hạng mục cha (${parent.code}).`);
        }
      }
    }

    const item = await prisma.wBSItem.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        code: data.code ?? null,
        parentId: data.parentId ?? null,
        level,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await AuditService.log({
      userId,
      action: "CREATE",
      entity: "WBSItem",
      entityId: item.id,
      newData: item,
    });

    eventBus.publish({
      type: 'WBS_CREATED',
      payload: item,
      metadata: { userId, projectId: data.projectId }
    });

    const { CacheService } = require("./cache.service");
    await CacheService.invalidatePrefix(`wbs:${data.projectId}`);

    return item;
  }

  static async update(id: string, data: UpdateWBSDTO, userId?: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hạng mục");

    let level = existing.level;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        if (data.parentId === id) {
          throw new ApiError(400, "Lỗi phân cấp: Không thể gán hạng mục cha là chính nó (Circular Reference).");
        }

        const descendantIds = await this.collectDescendantIds(id);
        if (descendantIds.includes(data.parentId)) {
          throw new ApiError(400, "Lỗi phân cấp: Không thể gán hạng mục cha vào một trong các hạng mục con của nó (Circular Reference).");
        }

        const parent = await prisma.wBSItem.findUnique({ where: { id: data.parentId } });
        if (!parent) throw new ApiError(404, "Không tìm thấy hạng mục cha");
        if (parent.projectId !== existing.projectId) throw new ApiError(400, "Hạng mục cha phải thuộc cùng một dự án");
        
        level = parent.level + 1;
      } else {
        level = 0;
      }
    }

    const item = await prisma.wBSItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        level,
      },
    });

    await AuditService.log({
      userId,
      action: "UPDATE",
      entity: "WBSItem",
      entityId: item.id,
      oldData: existing,
      newData: item,
    });

    eventBus.publish({
      type: 'WBS_UPDATED',
      payload: item,
      metadata: { userId, projectId: item.projectId }
    });

    const { CacheService } = require("./cache.service");
    await CacheService.invalidatePrefix(`wbs:${item.projectId}`);

    return item;
  }

  static async delete(id: string, userId?: string) {
    const existing = await prisma.wBSItem.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Không tìm thấy hạng mục");

    // Collect all descendant IDs (recursive) for cascade permanent delete
    const allIds = await this.collectDescendantIds(id);
    allIds.push(id); // Include self

    // PERMANENT DELETE: Cascade delete ALL related financial data + WBS items
    // Uses a single transaction to ensure atomicity
    // Must delete ALL FK-linked records before deleting WBS items
    // ORDER MATTERS: Payment → Revenue → Invoice (FK dependency chain)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete CostRecords
      const deletedCosts = await tx.costRecord.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 2. Delete BudgetRecords
      const deletedBudgets = await tx.budgetRecord.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 3. Collect Invoice IDs first (needed to delete Payments)
      const invoices = await tx.invoice.findMany({
        where: { wbsId: { in: allIds } },
        select: { id: true }
      });
      const invoiceIds = invoices.map(i => i.id);

      // 4. Delete Payments (FK: Payment.invoiceId → Invoice)
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } }
        });
      }

      // 5. Delete Revenues (FK: Revenue.invoiceId → Invoice AND Revenue.wbsId → WBS)
      await tx.revenue.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 6. Delete Invoices (now safe - no more FK dependents)
      await tx.invoice.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 7. Delete BOQItems and their dependencies
      const boqItems = await tx.bOQItem.findMany({
        where: { wbsId: { in: allIds } },
        select: { id: true }
      });
      const boqItemIds = boqItems.map(i => i.id);
      
      if (boqItemIds.length > 0) {
        await tx.progressEntry.deleteMany({
          where: { boqItemId: { in: boqItemIds } }
        });
      }

      await tx.bOQItem.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 8. Delete PurchaseOrderItems
      await tx.purchaseOrderItem.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 9. Delete SiteConsumption records
      await tx.siteConsumption.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 10. Delete SubcontractItems
      await tx.subcontractItem.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 11. Delete VariationOrders (optional wbsId, but we delete them)
      await tx.variationOrder.deleteMany({
        where: { wbsId: { in: allIds } }
      });

      // 11b. Nullify optional wbsId FKs on tables we DON'T cascade-delete
      await tx.purchaseRequest.updateMany({
        where: { wbsId: { in: allIds } },
        data: { wbsId: null }
      });
      await tx.activity.updateMany({
        where: { wbsId: { in: allIds } },
        data: { wbsId: null }
      });

      // 12. Delete WBS items: break self-referencing FK first, then delete all
      // Nullify parentId on all descendants to break FK constraints
      await tx.wBSItem.updateMany({
        where: { id: { in: allIds } },
        data: { parentId: null }
      });
      // Now safe to delete all WBS items at once
      await tx.wBSItem.deleteMany({
        where: { id: { in: allIds } }
      });

      return {
        deletedWBSCount: allIds.length,
        deletedCostCount: deletedCosts.count,
        deletedBudgetCount: deletedBudgets.count,
      };
    });

    await AuditService.log({
      userId,
      action: "HARD_DELETE",
      entity: "WBSItem",
      entityId: id,
      oldData: existing,
      reason: `Xóa vĩnh viễn (Permanent Delete) hạng mục WBS "${existing.name}" và ${result.deletedWBSCount - 1} hạng mục con, ${result.deletedCostCount} chi phí, ${result.deletedBudgetCount} dự toán.`,
    });

    eventBus.publish({
      type: 'WBS_DELETED',
      payload: { id, projectId: existing.projectId, cascade: result },
      metadata: { userId, projectId: existing.projectId }
    });

    const { CacheService } = require("./cache.service");
    await CacheService.invalidatePrefix(`wbs:${existing.projectId}`);

    return { deleted: true, ...result };
  }

  /**
   * Recursively collects all descendant WBS item IDs (children, grandchildren, etc.)
   */
  private static async collectDescendantIds(parentId: string): Promise<string[]> {
    const children = await prisma.wBSItem.findMany({
      where: { parentId },
      select: { id: true }
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandChildren = await this.collectDescendantIds(child.id);
      ids.push(...grandChildren);
    }
    return ids;
  }
}
