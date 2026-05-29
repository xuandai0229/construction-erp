/**
 * Protects dangerous operations based on environment configuration.
 */

export class EnvironmentGuard {
  static get env() {
    return process.env.APP_ENV || process.env.NODE_ENV || 'development';
  }

  static get isProduction() {
    return this.env === 'production';
  }

  static assertNotProduction(operationName: string) {
    if (this.isProduction) {
      throw new Error(`[SECURITY] Operation "${operationName}" is BLOCKED in production environment.`);
    }
  }

  static assertRestoreAllowed() {
    if (process.env.ALLOW_RESTORE !== 'true') {
      throw new Error(`[SECURITY] Restore operations are blocked. Set ALLOW_RESTORE=true to enable.`);
    }

    if (this.isProduction && process.env.ALLOW_PRODUCTION_RESTORE !== 'true') {
      throw new Error(`[SECURITY] Restore operations in PRODUCTION are blocked. Set ALLOW_PRODUCTION_RESTORE=true to enable.`);
    }
  }
}
