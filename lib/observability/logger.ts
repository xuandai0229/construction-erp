export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT'
}

export interface LogContext {
  userId?: string;
  projectId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: string;
  [key: string]: any;
}

/**
 * STRUCTURED LOGGER FOR ENTERPRISE ERP
 * Outputs JSON for ELK/Datadog/CloudWatch ingestion.
 */
export class Logger {
  static info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  static warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  static error(message: string, error?: Error | any, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      errorMessage: error?.message,
      stack: error?.stack
    });
  }

  static audit(message: string, context?: LogContext) {
    this.log(LogLevel.AUDIT, message, context);
  }

  private static log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };

    // In production, send to stdout (JSON format)
    console.log(JSON.stringify(entry));
    
    // In critical cases, trigger alerts
    if (level === LogLevel.ERROR) {
      this.triggerAlert(entry);
    }
  }

  private static triggerAlert(entry: any) {
    // Logic to send to PagerDuty/Slack/Email
    if (process.env.NODE_ENV === 'production') {
      // Send alert
    }
  }
}
