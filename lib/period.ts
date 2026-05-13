import { prisma } from "./prisma";
import { ApiError } from "./api-error";

export async function isPeriodLocked(date: Date | string) {
  const d = new Date(date);
  
  const period = await prisma.fiscalPeriod.findFirst({
    where: {
      startDate: { lte: d },
      endDate: { gte: d },
      isLocked: true
    }
  });
  
  return !!period;
}

export async function assertPeriodNotLocked(date: Date | string) {
  const d = new Date(date);
  const period = await prisma.fiscalPeriod.findFirst({
    where: {
      startDate: { lte: d },
      endDate: { gte: d },
      isLocked: true
    }
  });

  if (period) {
    throw new ApiError(403, `Kỳ kế toán từ ${period.startDate.toLocaleDateString()} đến ${period.endDate.toLocaleDateString()} đã bị khóa.`);
  }
}
