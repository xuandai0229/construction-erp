import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit.service";
import { headers } from "next/headers";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { z } from "zod";

const fiscalPeriodMutationSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  isLocked: z.boolean(),
  reason: z.string().trim().min(12, "Audit reason is required").max(1000),
});

async function getServiceOptions() {
  const head = await headers();
  return {
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

function buildFiscalPeriod(month: string, isLocked = false, lockedById?: string | null) {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number.parseInt(yearRaw, 10);
  const monthIndex = Number.parseInt(monthRaw, 10) - 1;

  return {
    month,
    isLocked,
    name: `Kỳ Kế Toán ${monthRaw}/${year}`,
    startDate: new Date(year, monthIndex, 1),
    endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
    lockedAt: isLocked ? new Date() : null,
    lockedById: isLocked ? lockedById : null,
    companyId: null,
  };
}

export async function GET() {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "PERIOD", "READ");

    let periods = await prisma.fiscalPeriod.findMany({
      orderBy: { month: "asc" },
    });

    if (periods.length === 0) {
      const currentYear = new Date().getFullYear();
      const recordsToCreate = Array.from({ length: 12 }, (_, i) => {
        const month = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
        return buildFiscalPeriod(month);
      });

      await prisma.fiscalPeriod.createMany({
        data: recordsToCreate,
        skipDuplicates: true,
      });

      periods = await prisma.fiscalPeriod.findMany({
        orderBy: { month: "asc" },
      });
    }

    return successResponse(periods);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    const { month, isLocked, reason } = fiscalPeriodMutationSchema.parse(await request.json());
    RBAC.assertPermission(user.role, "PERIOD", isLocked ? "LOCK" : "UNLOCK");

    const options = await getServiceOptions();
    const existing = await prisma.fiscalPeriod.findFirst({
      where: { month },
    });

    if (existing?.isLocked === isLocked) {
      return successResponse(existing);
    }

    const updatedPeriod = existing
      ? await prisma.fiscalPeriod.update({
          where: { id: existing.id },
          data: {
            isLocked,
            lockedAt: isLocked ? new Date() : null,
            lockedById: isLocked ? user.id : null,
          },
        })
      : await prisma.fiscalPeriod.create({
          data: buildFiscalPeriod(month, isLocked, user.id),
        });

    await AuditService.log({
      userId: user.id,
      action: isLocked ? "LOCK" : "UNLOCK",
      entity: "FiscalPeriod",
      entityId: updatedPeriod.id,
      oldData: existing || null,
      newData: updatedPeriod,
      reason,
      severity: isLocked ? "INFO" : "WARNING",
      correlationId: options.correlationId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    return successResponse(updatedPeriod);
  } catch (error) {
    return handleApiError(error);
  }
}
