import { prisma } from "@/lib/prisma";
import { LoggerService } from "../logger.service";

/**
 * Enterprise Accounting Governance
 * Enforces strict financial safety rules, such as Period Locks and Immutable Ledger rules.
 */
export class AccountingGovernance {
  /**
   * Throws an error if the given date falls into a locked fiscal period.
   */
  static async assertPeriodIsOpen(date: Date, companyId?: string) {
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    
    // Find if a period exists for this month and company
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        month,
        ...(companyId ? { companyId } : {})
      }
    });

    if (period && period.isLocked) {
      LoggerService.error(`[AccountingGovernance] Attempted to modify locked period ${month}`);
      throw new Error(`Kỳ kế toán ${month} đã bị khóa. Không thể thêm/sửa đổi/xóa dữ liệu tài chính trong kỳ này.`);
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
