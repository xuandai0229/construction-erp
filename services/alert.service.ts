import { LoggerService } from "./logger.service";

export class AlertService {
  static async sendAlert(title: string, message: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM") {
    const payload = {
      title,
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    // Log the alert to centralized logging
    LoggerService.fatal(`[ALERT] ${title}: ${message}`, { severity });

    // Mock External Integration
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      // In a real app, we would fetch(https://api.telegram.org/...)
      LoggerService.info("Telegram alert queued", { title });
    }

    if (severity === "CRITICAL") {
      // Logic for emergency notification could go here
    }

    return true;
  }

  static async notifySystemFailure(error: any) {
    return this.sendAlert(
      "System Critical Failure",
      error.message || "Unknown error",
      "CRITICAL"
    );
  }
}
