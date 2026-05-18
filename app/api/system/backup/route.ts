import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit.service";
import { headers } from "next/headers";
import { assertHasRole } from "@/lib/auth-guard";
import { UserRole } from "../../../../generated/prisma-client";
import { ApiError } from "@/lib/api-error";

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
    const options = await getServiceOptions();
    
    // Authorization Hardening: Only Super Admin can export raw backup snapshots (Batch 7.2 & 7.6)
    await assertHasRole(options.userId, [UserRole.SUPER_ADMIN]);

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
      auditLogs
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
      prisma.auditLog.findMany()
    ]);

    // Audit backup export event (Batch 7.2 & 7.7)
    await AuditService.log({
      userId: options.userId !== "system_internal_admin" ? options.userId : undefined,
      action: "UPDATE",
      entity: "System",
      entityId: "SYSTEM_BACKUP",
      reason: "Trích xuất sao lưu dữ liệu toàn cục thành công.",
      severity: "WARNING",
      correlationId: options.correlationId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
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
        auditLogs
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const options = await getServiceOptions();

    // Authorization Hardening: Only Super Admin can restore database state (Batch 7.2)
    await assertHasRole(options.userId, [UserRole.SUPER_ADMIN]);

    const { backup } = await request.json();
    if (!backup || typeof backup !== "object") {
      return NextResponse.json({ success: false, error: "Dữ liệu sao lưu không hợp lệ." }, { status: 400 });
    }

    // Schema and Integrity validation check (Batch 7.6 backup verification)
    const requiredTables = ["users", "projects", "costs", "ledgerAccounts", "journalEntries", "transactionLines"];
    for (const table of requiredTables) {
      if (!Array.isArray(backup[table])) {
        // Log critical backup corruption security alert
        await AuditService.log({
          userId: options.userId !== "system_internal_admin" ? options.userId : undefined,
          action: "SECURITY_ALERT",
          entity: "System",
          entityId: "SYSTEM_RESTORE_FAIL",
          reason: `Phục hồi thất bại: File backup bị lỗi cấu trúc dữ liệu bảng ${table}.`,
          severity: "CRITICAL",
          correlationId: options.correlationId
        });
        return NextResponse.json({ success: false, error: `Sao lưu bị lỗi hoặc thiếu dữ liệu bảng bắt buộc: ${table}` }, { status: 400 });
      }
    }

    // Perform validation and restoration inside a SINGLE isolated transaction for absolute safety! (Batch 6.6)
    await prisma.$transaction(async (tx) => {
      // 1. Delete all records in safe topological order to satisfy foreign key constraints
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
      await tx.auditLog.deleteMany();
      await tx.user.deleteMany();

      // 2. Re-insert records in correct topological order
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
      if (backup.auditLogs?.length) await tx.auditLog.createMany({ data: backup.auditLogs });
    });

    // Write restoration audit entry
    await AuditService.log({
      userId: options.userId !== "system_internal_admin" ? options.userId : undefined,
      action: "RESTORE",
      entity: "System",
      entityId: "SYSTEM_RESTORE",
      reason: "Khôi phục dữ liệu toàn cục từ file JSON sao lưu thành công.",
      severity: "CRITICAL",
      correlationId: options.correlationId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}
