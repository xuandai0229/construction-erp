import { prisma } from "./prisma";

export interface StartupValidationResult {
  healthy: boolean;
  timestamp: string;
  errors: string[];
  warnings: string[];
  checks: {
    environment: { status: "OK" | "FAIL"; details: Record<string, string> };
    databaseSchema: { status: "OK" | "FAIL"; latencyMs: number };
    migrations: { status: "OK" | "FAIL"; appliedCount: number };
  };
}

export class StartupValidator {
  /**
   * Authoritative startup validation checklist (Batch 7.3)
   */
  static async validate(): Promise<StartupValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = new Date().toISOString();

    // 1. Environment Consistency Checks
    const criticalVars = ["DATABASE_URL"];
    const optionalVars = ["SESSION_SECRET", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    
    const envDetails: Record<string, string> = {};
    
    for (const v of criticalVars) {
      if (!process.env[v]) {
        errors.push(`Thiếu biến môi trường nghiêm trọng: ${v}`);
        envDetails[v] = "MISSING";
      } else {
        envDetails[v] = "PRESENT";
      }
    }

    for (const v of optionalVars) {
      if (!process.env[v]) {
        warnings.push(`Khuyên dùng cấu hình biến môi trường: ${v}`);
        envDetails[v] = "NOT_CONFIGURED";
      } else {
        envDetails[v] = "PRESENT";
      }
    }

    // 2. Schema compatibility & DB connection check (prevent silent schema mismatch)
    let schemaStatus: "OK" | "FAIL" = "OK";
    let dbLatency = 0;
    const startDb = Date.now();
    
    try {
      // Execute lightweight queries against critical tables to verify schema compatibility
      await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        prisma.user.findFirst({ select: { id: true } }),
        prisma.project.findFirst({ select: { id: true } }),
        prisma.journalEntry.findFirst({ select: { id: true } })
      ]);
      dbLatency = Date.now() - startDb;
    } catch (e: any) {
      schemaStatus = "FAIL";
      errors.push(`Lỗi tương thích schema database hoặc mất kết nối: ${e.message}`);
    }

    // 3. Migration consistency checks
    let migrationStatus: "OK" | "FAIL" = "OK";
    let appliedCount = 0;
    
    try {
      // Query Prisma migrations history table directly
      const migrations: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`
      );
      appliedCount = migrations.length;
    } catch (e: any) {
      // If table doesn't exist, it means migrations are either not started or database is clean
      migrationStatus = "FAIL";
      warnings.push(`Không thể kiểm tra lịch sử migrations (_prisma_migrations). Lý do: ${e.message}`);
    }

    const healthy = errors.length === 0;

    return {
      healthy,
      timestamp,
      errors,
      warnings,
      checks: {
        environment: {
          status: errors.some(e => e.startsWith("Thiếu biến môi trường")) ? "FAIL" : "OK",
          details: envDetails
        },
        databaseSchema: {
          status: schemaStatus,
          latencyMs: dbLatency
        },
        migrations: {
          status: migrationStatus,
          appliedCount
        }
      }
    };
  }
}
