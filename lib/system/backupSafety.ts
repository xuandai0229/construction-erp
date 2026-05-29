import { EnvironmentGuard } from "./environmentGuard";

export interface BackupMetadata {
  generatedAt: string;
  generatedBy: string;
  appVersion: string;
  schemaVersion: string;
  databaseProvider: string;
  checksum: string;
}

export class BackupSafetyService {
  /**
   * Validates if a backup can be created
   */
  static async validateBackupRequest(userRole: string) {
    if (userRole !== "SUPER_ADMIN") {
      throw new Error("UNAUTHORIZED: Only SUPER_ADMIN can create backups.");
    }
    // Audit log should be handled by caller
    return true;
  }

  /**
   * Validates if a restore can be executed
   */
  static async validateRestoreRequest(
    userRole: string,
    metadata: BackupMetadata,
    confirmationToken: string,
    providedChecksum: string,
    isDryRun: boolean = true
  ) {
    if (userRole !== "SUPER_ADMIN") {
      throw new Error("UNAUTHORIZED: Only SUPER_ADMIN can restore backups.");
    }

    if (!isDryRun) {
      EnvironmentGuard.assertRestoreAllowed();
      
      if (!confirmationToken || confirmationToken !== process.env.RESTORE_CONFIRMATION_TOKEN) {
        throw new Error("SECURITY: Invalid or missing confirmation token for restore.");
      }
    }

    if (!metadata || !metadata.checksum) {
      throw new Error("INTEGRITY: Backup metadata is missing or corrupted.");
    }

    if (providedChecksum && metadata.checksum !== providedChecksum) {
      throw new Error("INTEGRITY: Checksum mismatch. The backup might be tampered with.");
    }

    // Additional validations like schemaVersion compatibility would go here
    return true;
  }

  /**
   * Excludes sensitive patterns from being backed up
   */
  static getExcludedPatterns() {
    return [
      ".env",
      ".env.*",
      "node_modules",
      ".git",
      "certs",
      "secrets.json"
    ];
  }
}
