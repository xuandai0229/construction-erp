import { AccountingGovernance } from "@/services/finance/accounting-governance";

export async function isPeriodLocked(date: Date | string, companyId?: string) {
  try {
    await AccountingGovernance.assertPeriodIsOpen(new Date(date), companyId);
    return false;
  } catch {
    return true;
  }
}

export async function assertPeriodNotLocked(date: Date | string, companyId?: string) {
  await AccountingGovernance.assertPeriodIsOpen(new Date(date), companyId);
}
