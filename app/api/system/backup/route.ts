import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/api-error";
import { AuditService } from "@/services/audit.service";
import { auditSecurityAccess, requireSuperAdmin } from "@/lib/route-security";

async function getRequestContext() {
  const head = await headers();
  return {
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

function getRestoreTableSummary(backup: Record<string, unknown>) {
  const tableNames = [
    "users",
    "fiscalPeriods",
    "projects",
    "wbs",
    "categories",
    "tasks",
    "costs",
    "invoices",
    "revenues",
    "payments",
    "ledgerAccounts",
    "journalEntries",
    "transactionLines",
  ];

  return Object.fromEntries(
    tableNames.map((table) => [table, Array.isArray(backup[table]) ? backup[table].length : 0]),
  );
}

function assertRestoreExecutionAllowed(confirmationToken?: string) {
  const configuredToken = process.env.SYSTEM_RESTORE_CONFIRMATION_TOKEN;
  const executionEnabled = process.env.ALLOW_SYSTEM_RESTORE_EXECUTION === "true";
  const productionEnabled = process.env.ALLOW_PRODUCTION_SYSTEM_RESTORE === "true";

  if (!executionEnabled) {
    throw new ApiError(403, "System restore execution is disabled. Run dryRun=true to validate backup payload.");
  }
  if (process.env.NODE_ENV === "production" && !productionEnabled) {
    throw new ApiError(403, "System restore execution is blocked in production without ALLOW_PRODUCTION_SYSTEM_RESTORE=true.");
  }
  if (!configuredToken || confirmationToken !== configuredToken) {
    throw new ApiError(400, "Restore execution requires SYSTEM_RESTORE_CONFIRMATION_TOKEN.");
  }
}

export async function GET() {
  try {
    const user = await requireSuperAdmin();
    const context = await getRequestContext();

    const [
      users,
      projects,
      wbs,
      categories,
      tasks,
      costs,
      revenues,
      invoices,
      payments,
      ledgerAccounts,
      journalEntries,
      transactionLines,
      fiscalPeriods,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.project.findMany(),
      prisma.wBSItem.findMany(),
      prisma.category.findMany(),
      prisma.task.findMany(),
      prisma.costRecord.findMany(),
      prisma.revenue.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
      prisma.ledgerAccount.findMany(),
      prisma.journalEntry.findMany(),
      prisma.transactionLine.findMany(),
      prisma.fiscalPeriod.findMany(),
      prisma.auditLog.findMany(),
    ]);

    await auditSecurityAccess({
      userId: user.id,
      entity: "SystemBackup",
      entityId: user.companyId || "GLOBAL",
      reason: "Super admin exported a full system backup snapshot.",
      severity: "CRITICAL",
      data: {
        companyId: user.companyId,
        projectId: null,
        reportType: "system-backup",
        format: "json",
        timestamp: new Date().toISOString(),
        correlationId: context.correlationId,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      data: {
        users,
        projects,
        wbs,
        categories,
        tasks,
        costs,
        revenues,
        invoices,
        payments,
        ledgerAccounts,
        journalEntries,
        transactionLines,
        fiscalPeriods,
        auditLogs,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSuperAdmin();
    const context = await getRequestContext();
    const { backup, confirmationToken, reason, dryRun = true } = await request.json();

    if (!backup || typeof backup !== "object") {
      throw new ApiError(400, "Invalid backup payload.");
    }
    if (typeof reason !== "string" || reason.trim().length < 10) {
      throw new ApiError(400, "Restore requires an explicit audit reason of at least 10 characters.");
    }

    await auditSecurityAccess({
      userId: user.id,
      entity: "SystemRestore",
      entityId: user.companyId || "GLOBAL",
      reason: `Restore requested: ${reason.trim()}`,
      severity: "CRITICAL",
      data: {
        companyId: user.companyId,
        projectId: null,
        reportType: "system-restore",
        format: "json",
        mode: dryRun ? "dry-run" : "execute",
        affectedTables: getRestoreTableSummary(backup as Record<string, unknown>),
        timestamp: new Date().toISOString(),
        correlationId: context.correlationId,
      },
    });

    const requiredTables = ["users", "projects", "costs", "ledgerAccounts", "journalEntries", "transactionLines"];
    for (const table of requiredTables) {
      if (!Array.isArray(backup[table])) {
        await AuditService.log({
          userId: user.id,
          action: "SECURITY_ALERT",
          entity: "System",
          entityId: "SYSTEM_RESTORE_FAIL",
          reason: `Restore failed: backup payload is missing required table ${table}.`,
          severity: "CRITICAL",
          correlationId: context.correlationId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        throw new ApiError(400, `Backup is missing required table: ${table}`);
      }
    }

    const affectedTables = getRestoreTableSummary(backup as Record<string, unknown>);

    if (dryRun) {
      await AuditService.log({
        userId: user.id,
        action: "SECURITY_ALERT",
        entity: "System",
        entityId: "SYSTEM_RESTORE_DRY_RUN",
        reason: `System restore dry-run completed. Reason: ${reason.trim()}`,
        severity: "CRITICAL",
        newData: { mode: "dry-run", affectedTables },
        correlationId: context.correlationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return NextResponse.json({ success: true, data: { mode: "dry-run", affectedTables } });
    }

    assertRestoreExecutionAllowed(confirmationToken);

    await prisma.$transaction(async (tx) => {
      await tx.transactionLine.deleteMany();
      await tx.journalEntry.deleteMany();
      await tx.ledgerAccount.deleteMany();
      await tx.payment.deleteMany();
      await tx.revenue.deleteMany();
      await tx.invoice.deleteMany();
      await tx.costRecord.deleteMany();
      await tx.task.deleteMany();
      await tx.category.deleteMany();
      await tx.wBSItem.deleteMany();
      await tx.project.deleteMany();
      await tx.fiscalPeriod.deleteMany();
      await tx.user.deleteMany();

      if (backup.users?.length) await tx.user.createMany({ data: backup.users });
      if (backup.fiscalPeriods?.length) await tx.fiscalPeriod.createMany({ data: backup.fiscalPeriods });
      if (backup.projects?.length) await tx.project.createMany({ data: backup.projects });
      if (backup.wbs?.length) await tx.wBSItem.createMany({ data: backup.wbs });
      if (backup.categories?.length) await tx.category.createMany({ data: backup.categories });
      if (backup.tasks?.length) await tx.task.createMany({ data: backup.tasks });
      if (backup.costs?.length) await tx.costRecord.createMany({ data: backup.costs });
      if (backup.invoices?.length) await tx.invoice.createMany({ data: backup.invoices });
      if (backup.revenues?.length) await tx.revenue.createMany({ data: backup.revenues });
      if (backup.payments?.length) await tx.payment.createMany({ data: backup.payments });
      if (backup.ledgerAccounts?.length) await tx.ledgerAccount.createMany({ data: backup.ledgerAccounts });
      if (backup.journalEntries?.length) await tx.journalEntry.createMany({ data: backup.journalEntries });
      if (backup.transactionLines?.length) await tx.transactionLine.createMany({ data: backup.transactionLines });
    });

    await AuditService.log({
      userId: user.id,
      action: "RESTORE",
      entity: "System",
      entityId: "SYSTEM_RESTORE",
      reason: `Full system restore completed. Reason: ${reason.trim()}`,
      severity: "CRITICAL",
      newData: { mode: "execute", affectedTables },
      correlationId: context.correlationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
