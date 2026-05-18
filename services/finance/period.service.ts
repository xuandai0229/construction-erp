import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { AuditService } from "../audit.service";
import { SnapshotEngine } from "./snapshot.engine";
import { eventBus } from "@/lib/event-bus";

export class PeriodService {
  /**
   * Enterprise Period Locking Mechanism
   */
  static async lockPeriod(periodId: string, userId: string, companyId?: string) {
    const period = await prisma.fiscalPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error("Period not found");

    if (companyId && period.companyId && period.companyId !== companyId) {
      throw new Error("Tenant isolation violation: Cannot lock other tenant's period");
    }

    const updated = await prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedById: userId
      }
    });

    // 1. Immutable Audit Trail
    await AuditService.log({
      action: "LOCK",
      entity: "FiscalPeriod",
      entityId: periodId,
      oldData: { isLocked: false },
      newData: { isLocked: true },
      userId,
      reason: "Month-end closing procedure",
      severity: "CRITICAL"
    });

    // 2. Generate Final Accounting Snapshot
    await SnapshotEngine.generatePeriodSnapshot(periodId, companyId);

    // 3. Notify ecosystem
    eventBus.publish({
      type: "PERIOD_LOCKED",
      payload: { periodId },
      metadata: { userId, companyId }
    });

    LoggerService.info(`[PeriodService] Locked period ${period.month}`, { periodId, userId });
    return updated;
  }

  static async reopenPeriod(periodId: string, userId: string, reason: string) {
    // Only Admin/CFO overrides can do this, enforced at API level
    const updated = await prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedById: null
      }
    });

    await AuditService.log({
      action: "UNLOCK",
      entity: "FiscalPeriod",
      entityId: periodId,
      oldData: { isLocked: true },
      newData: { isLocked: false },
      userId,
      reason,
      severity: "CRITICAL"
    });

    LoggerService.warn(`[PeriodService] Reopened period ${periodId}`, { userId, reason });
    return updated;
  }
}
