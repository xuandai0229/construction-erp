import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { AuditService } from "../audit.service";
import { LoggerService } from "../logger.service";

export class AccountingLockService {
  /**
   * Khóa kỳ kế toán.
   */
  static async lockPeriod(month: string, companyId: string | null, userId: string, reason: string) {
    if (!reason) {
      throw new ApiError(400, "Bắt buộc phải nhập lý do khi khóa kỳ kế toán.");
    }

    return prisma.$transaction(async (tx) => {
      let period = await tx.fiscalPeriod.findFirst({
        where: { month, ...(companyId ? { companyId } : {}) }
      });

      if (period && period.isLocked) {
        throw new ApiError(400, `Kỳ kế toán ${month} đã bị khóa.`);
      }

      if (!period) {
        period = await tx.fiscalPeriod.create({
          data: {
            month,
            companyId,
            isLocked: true,
            lockedAt: new Date(),
            lockedById: userId
          }
        });
      } else {
        period = await tx.fiscalPeriod.update({
          where: { id: period.id },
          data: {
            isLocked: true,
            lockedAt: new Date(),
            lockedById: userId
          }
        });
      }

      await AuditService.log({
        userId,
        action: "LOCK",
        entity: "FiscalPeriod",
        entityId: period.id,
        newData: period,
        reason: `Khóa kỳ kế toán ${month}: ${reason}`
      });

      await LoggerService.info(`Fiscal period ${month} locked by user ${userId}. Reason: ${reason}`);

      return period;
    });
  }

  /**
   * Mở khóa kỳ kế toán. Yêu cầu quyền admin/accounting director.
   */
  static async reopenPeriod(month: string, companyId: string | null, userId: string, reason: string) {
    if (!reason) {
      throw new ApiError(400, "Bắt buộc phải nhập lý do khi mở khóa kỳ kế toán.");
    }

    return prisma.$transaction(async (tx) => {
      const period = await tx.fiscalPeriod.findFirst({
        where: { month, ...(companyId ? { companyId } : {}) }
      });

      if (!period || !period.isLocked) {
        throw new ApiError(400, `Kỳ kế toán ${month} chưa bị khóa hoặc không tồn tại.`);
      }

      const updatedPeriod = await tx.fiscalPeriod.update({
        where: { id: period.id },
        data: {
          isLocked: false,
          lockedAt: null,
          lockedById: null
        }
      });

      await AuditService.log({
        userId,
        action: "UNLOCK",
        entity: "FiscalPeriod",
        entityId: period.id,
        oldData: period,
        newData: updatedPeriod,
        reason: `Mở khóa kỳ kế toán ${month}: ${reason}`
      });

      await LoggerService.info(`Fiscal period ${month} reopened by user ${userId}. Reason: ${reason}`);

      return updatedPeriod;
    });
  }
}
