import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";
import { ApiError } from "@/lib/api-error";

/**
 * Enterprise Accounting Governance
 * Enforces strict financial safety rules, such as Period Locks and Immutable Ledger rules.
 * 
 * Phase 2 Enhancement: Now checks both legacy FiscalPeriod and new AccountingPeriod models.
 * The new AccountingPeriod model takes precedence when available.
 */
export class AccountingGovernance {
  /**
   * Throws an error if the given date falls into a locked fiscal period.
   * Checks both the new AccountingPeriod (Phase 2) and legacy FiscalPeriod for backward compatibility.
   */
  static async assertPeriodIsOpen(date: Date, companyId?: string) {
    const month = date.toISOString().slice(0, 7); // YYYY-MM

    // Phase 2: Check new AccountingPeriod model first
    if (companyId) {
      const accountingPeriod = await prisma.accountingPeriod.findFirst({
        where: {
          month,
          fiscalYear: { companyId }
        },
        select: { status: true, month: true }
      });

      if (accountingPeriod) {
        if (accountingPeriod.status === "CLOSED") {
          LoggerService.error(`[AccountingGovernance] Attempted to modify CLOSED accounting period ${month}`);
          throw new ApiError(422, `Kỳ kế toán ${month} đã được khóa sổ bởi CFO. Mọi thao tác thêm/sửa/xóa chứng từ tài chính đều bị cấm. Vui lòng liên hệ CFO để mở lại kỳ nếu cần điều chỉnh.`);
        }
        // Period exists and is OPEN — allow operation
        return true;
      }
    }

    // Legacy fallback: Check old FiscalPeriod model
    const legacyPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        month,
        ...(companyId ? { companyId } : {})
      }
    });

    if (legacyPeriod && legacyPeriod.isLocked) {
      LoggerService.error(`[AccountingGovernance] Attempted to modify locked period ${month} (legacy)`);
      throw new ApiError(400, `Kỳ kế toán ${month} đã bị khóa. Không thể thêm/sửa đổi/xóa dữ liệu tài chính trong kỳ này.`);
    }
    
    return true;
  }

  /**
   * Enforces the Immutable Ledger pattern.
   * Direct updates are disallowed. Instead, users must create a REVERSAL or ADJUSTMENT.
   * This is a safeguard check.
   */
  static assertNotDirectlyUpdatingLockedFields(oldStatus: string, newStatus: string) {
    if (['POSTED', 'LOCKED', 'REVERSED'].includes(oldStatus)) {
      if (newStatus !== 'REVERSED' && newStatus !== 'ARCHIVED') {
        throw new Error("Không thể thay đổi trạng thái của bản ghi đã được POSTED hoặc LOCKED. Vui lòng tạo bút toán đảo ngược (Reversal Entry).");
      }
    }
  }
}
