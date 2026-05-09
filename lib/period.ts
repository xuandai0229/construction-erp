import { prisma } from "./prisma";

export async function isPeriodLocked(date: Date | string) {
  const d = new Date(date);
  const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  const period = await prisma.fiscalPeriod.findUnique({
    where: { month: monthStr }
  });
  
  return period?.isLocked || false;
}

export async function assertPeriodNotLocked(date: Date | string) {
  if (await isPeriodLocked(date)) {
    const d = new Date(date);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    throw new Error(`Kỳ kế toán ${monthStr} đã bị khóa. Không thể thực hiện thao tác này.`);
  }
}
