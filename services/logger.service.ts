import { prisma } from "@/lib/prisma";
import { Prisma } from "../generated/prisma-client";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  error?: any;
  [key: string]: any;
}

export class LoggerService {
  static async log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date();
    
    // Structured log for stdout (useful for cloud logging like CloudWatch/GCP)
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    
    console.log(JSON.stringify(logEntry));

    // For critical errors or specific audit needs, we also store in DB
    // But we don't store EVERY info log to avoid DB bloat
    if (level === "ERROR" || level === "FATAL" || (level === "WARN" && context?.statusCode === 403)) {
      try {
        // We use the existing AuditLog table for persistence if it's an error worth tracking
        await prisma.auditLog.create({
          data: {
            action: level,
            entity: "SYSTEM",
            entityId: context?.route || "GLOBAL",
            severity: level === "FATAL" ? "CRITICAL" : "WARNING",
            requestId: context?.requestId,
            userId: context?.userId,
            reason: message,
            oldData: context?.error ? { message: (context.error as any).message, stack: (context.error as any).stack } : Prisma.JsonNull,
            newData: context as any || Prisma.JsonNull,
          },
        });
      } catch (dbError) {
        // Fallback if DB is down
        console.error("[LoggerService] Failed to persist log to DB:", dbError);
      }
    }
  }

  static info(message: string, context?: LogContext) {
    return this.log("INFO", message, context);
  }

  static warn(message: string, context?: LogContext) {
    return this.log("WARN", message, context);
  }

  static error(message: string, context?: LogContext) {
    return this.log("ERROR", message, context);
  }

  static fatal(message: string, context?: LogContext) {
    return this.log("FATAL", message, context);
  }
}
