import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit.service";
import { headers } from "next/headers";

async function getServiceOptions() {
  const head = await headers();
  return {
    userId: head.get("x-user-id") || "system_internal_admin",
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function GET() {
  try {
    let periods = await prisma.fiscalPeriod.findMany({
      orderBy: { month: "asc" }
    });

    // Automatically seed fiscal periods for the year 2026 if none exist
    if (periods.length === 0) {
      const currentYear = new Date().getFullYear();
      const recordsToCreate = Array.from({ length: 12 }, (_, i) => {
        const monthNum = String(i + 1).padStart(2, '0');
        const monthStr = `${currentYear}-${monthNum}`;
        return {
          month: monthStr,
          isLocked: false,
          name: `Kỳ Kế Toán ${monthNum}/${currentYear}`,
          startDate: new Date(currentYear, i, 1),
          endDate: new Date(currentYear, i + 1, 0, 23, 59, 59, 999),
        };
      });

      await prisma.fiscalPeriod.createMany({
        data: recordsToCreate
      });

      periods = await prisma.fiscalPeriod.findMany({
        orderBy: { month: "asc" }
      });
    }

    return successResponse(periods);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, isLocked, reason } = body;

    if (!month) {
      return handleApiError(new Error("Thiếu kỳ kế toán (month)"));
    }

    const options = await getServiceOptions();

    // 1. Get or create the fiscal period
    const existing = await prisma.fiscalPeriod.findUnique({
      where: { month }
    });

    let updatedPeriod;
    const dateNow = new Date();

    if (existing) {
      updatedPeriod = await prisma.fiscalPeriod.update({
        where: { id: existing.id },
        data: {
          isLocked,
          lockedAt: isLocked ? dateNow : null,
          lockedById: isLocked ? (options.userId !== "system_internal_admin" ? options.userId : null) : null,
          updatedAt: dateNow
        }
      });
    } else {
      const parts = month.split('-');
      const year = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      
      updatedPeriod = await prisma.fiscalPeriod.create({
        data: {
          month,
          isLocked,
          name: `Kỳ Kế Toán ${parts[1]}/${year}`,
          startDate: new Date(year, m, 1),
          endDate: new Date(year, m + 1, 0, 23, 59, 59, 999),
          lockedAt: isLocked ? dateNow : null,
          lockedById: isLocked ? (options.userId !== "system_internal_admin" ? options.userId : null) : null
        }
      });
    }

    // 2. Write to Audit Log (Immutable record of lock/reopen action)
    await AuditService.log({
      userId: options.userId !== "system_internal_admin" ? options.userId : undefined,
      action: isLocked ? "LOCK" : "UNLOCK",
      entity: "FiscalPeriod",
      entityId: updatedPeriod.id,
      oldData: existing || null,
      newData: updatedPeriod,
      reason: reason || (isLocked ? "Khóa sổ kỳ kế toán" : "Mở khóa sổ kỳ kế toán"),
      severity: isLocked ? "INFO" : "WARNING",
      correlationId: options.correlationId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });

    return successResponse(updatedPeriod);
  } catch (error) {
    return handleApiError(error);
  }
}
