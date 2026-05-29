import { EnvironmentGuard } from "../../lib/system/environmentGuard";
import { BackupSafetyService, BackupMetadata } from "../../lib/system/backupSafety";
import * as fs from "fs";

async function runProductionGuards() {
  console.log("======================================================");
  console.log("   RUNNING SPRINT 2.8: PRODUCTION READINESS GUARDS    ");
  console.log("======================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ THẤT BẠI: ${message}`);
    }
  }

  // 1. Environment Guard
  process.env.APP_ENV = "production";
  try {
    EnvironmentGuard.assertNotProduction("TestDestructive");
    assert(false, "Môi trường Production chưa chặn được lệnh phá hủy.");
  } catch (e: any) {
    assert(e.message.includes("BLOCKED in production"), "Production Environment Guard chặn chính xác thao tác phá hủy.");
  }

  // 2. Health & Readiness Endpoint file existence
  const healthExists = fs.existsSync("app/api/health/route.ts");
  const readinessExists = fs.existsSync("app/api/readiness/route.ts");
  assert(healthExists, "Đã có Health check endpoint.");
  assert(readinessExists, "Đã có Readiness check endpoint.");

  // 3. Backup Safety
  try {
    await BackupSafetyService.validateBackupRequest("USER");
    assert(false, "Backup Route không chặn User thường.");
  } catch (e: any) {
    assert(e.message.includes("UNAUTHORIZED"), "Backup Route giới hạn chính xác quyền SUPER_ADMIN.");
  }

  // 4. Restore Dry-Run
  const metadata: BackupMetadata = {
    generatedAt: new Date().toISOString(),
    generatedBy: "ADMIN",
    appVersion: "1.0",
    schemaVersion: "1.0",
    databaseProvider: "postgresql",
    checksum: "valid-checksum-123"
  };

  try {
    await BackupSafetyService.validateRestoreRequest("SUPER_ADMIN", metadata, "wrong-token", "valid-checksum-123", true);
    assert(true, "Restore mặc định chạy an toàn ở chế độ Dry-Run (không cần xác thực Token vì chưa chạy thật).");
  } catch (e) {
    assert(false, "Dry-Run Restore không hoạt động.");
  }

  // 5. Restore Token Check
  try {
    await BackupSafetyService.validateRestoreRequest("SUPER_ADMIN", metadata, "wrong-token", "valid-checksum-123", false);
    assert(false, "Restore thực thụ không chặn sai token.");
  } catch (e: any) {
    assert(e.message.includes("blocked"), "Restore thực thụ bị chặn khi thiếu ALLOW_RESTORE env.");
  }

  // 6. Excluded patterns check
  const excludes = BackupSafetyService.getExcludedPatterns();
  assert(excludes.includes(".env") && excludes.includes("node_modules"), "Backup Metadata đã loại trừ .env và các file nhạy cảm.");

  console.log("\n======================================================");
  if (passed === total) {
    console.log(` KẾT QUẢ: ${passed}/${total} Kiểm Tra Vượt Qua Bão Đảm!`);
    process.exit(0);
  } else {
    console.error(` KẾT QUẢ: ${passed}/${total}. CẦN FIX NGAY LẬP TỨC!`);
    process.exit(1);
  }
}

runProductionGuards();
