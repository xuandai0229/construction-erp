import { LoggerService } from "@/services/logger.service";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  factor?: number;
  jitter?: boolean;
}

export class Resilience {
  /**
   * Safe Retry Strategy with Exponential Backoff and Jitter (Batch 7.4 retry policies)
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelayMs = options.baseDelayMs ?? 100;
    const factor = options.factor ?? 2;
    const useJitter = options.jitter ?? true;

    let attempt = 0;
    
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        if (attempt > maxRetries) {
          LoggerService.error(`[Resilience] Thất bại sau ${attempt - 1} lần thử lại. Lỗi: ${error.message}`);
          throw error;
        }

        // Calculate delay with backoff
        let delay = baseDelayMs * Math.pow(factor, attempt - 1);
        
        // Add random jitter to prevent retry storms (Batch 7.4 retry strategy)
        if (useJitter) {
          delay = delay * (0.5 + Math.random());
        }

        LoggerService.warn(
          `[Resilience] Phát hiện lỗi. Đang thử lại lần ${attempt}/${maxRetries} sau ${Math.round(delay)}ms. Lỗi: ${error.message}`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Timeout Wrapper to contain hanging processes (Batch 7.4 timeout handling)
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorContext: string = "Tác vụ"
  ): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[Resilience] Lỗi quá thời gian (Timeout): ${errorContext} vượt quá hạn mức ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

// ─── GRACEFUL SHUTDOWN REGISTRY ───────────────────────────
type CleanupTask = () => Promise<void> | void;
const cleanupTasks: CleanupTask[] = [];

/**
 * Registers cleanup hooks for process restarts to ensure restart safety (Batch 7.4)
 */
export function registerCleanupTask(task: CleanupTask) {
  cleanupTasks.push(task);
}

let isShuttingDown = false;
async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  LoggerService.warn(`[Graceful Shutdown] Nhận tín hiệu ${signal}. Bắt đầu giải phóng tài nguyên...`);
  
  const timeoutMs = 5000;
  const cleanupPromise = (async () => {
    for (let i = 0; i < cleanupTasks.length; i++) {
      try {
        await cleanupTasks[i]();
      } catch (err: any) {
        LoggerService.error(`[Graceful Shutdown] Lỗi giải phóng tài nguyên tại vị trí ${i}: ${err.message}`);
      }
    }
  })();

  try {
    // Force timeout to avoid hanging processes during shutdown
    await Resilience.withTimeout(cleanupPromise, timeoutMs, "Giải phóng tài nguyên lúc tắt máy");
    LoggerService.info("[Graceful Shutdown] Giải phóng tài nguyên hoàn tất. Tắt máy an toàn.");
    process.exit(0);
  } catch (err: any) {
    LoggerService.error(`[Graceful Shutdown] Tắt máy cưỡng chế do lỗi: ${err.message}`);
    process.exit(1);
  }
}

// Attach listeners safely in environments that support process
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}
