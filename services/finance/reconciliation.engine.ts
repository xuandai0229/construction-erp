import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";

/**
 * Enterprise Reconciliation Engine
 * Runs asynchronously to prevent Race Conditions on Read operations.
 */
export class ReconciliationEngine {
  /**
   * Reconciles total budget for all projects or a specific one.
   * Resolves the "totalBudget drift" issue asynchronously.
   */
  static async reconcileBudget(projectId?: string) {
    LoggerService.info(`[ReconciliationEngine] Starting budget reconciliation ${projectId ? `for project ${projectId}` : 'globally'}.`);

    const projects = projectId 
      ? [{ id: projectId }]
      : await prisma.project.findMany({ select: { id: true } });

    let fixedCount = 0;

    for (const p of projects) {
      const budgetsAgg = await prisma.budgetRecord.aggregate({
        where: { projectId: p.id, deletedAt: null },
        _sum: { estimatedAmount: true }
      });

      const calculatedBudget = Number(budgetsAgg._sum?.estimatedAmount || 0);

      const prj = await prisma.project.findUnique({ where: { id: p.id }, select: { totalBudget: true } });
      
      if (prj && Math.abs(Number(prj.totalBudget || 0) - calculatedBudget) > 0.01) {
        await prisma.project.update({
          where: { id: p.id },
          data: { totalBudget: calculatedBudget }
        });
        fixedCount++;
        LoggerService.info(`[ReconciliationEngine] Fixed budget drift for project ${p.id}. Drift: ${Number(prj.totalBudget || 0)} -> ${calculatedBudget}`);
      }
    }

    LoggerService.info(`[ReconciliationEngine] Reconciliation complete. Fixed ${fixedCount} projects.`);
    return fixedCount;
  }
}
