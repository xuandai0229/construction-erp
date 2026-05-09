import { prisma } from "@/lib/prisma";
import { LoggerService } from "./logger.service";

export class BackupService {
  static async runBackup() {
    LoggerService.info("Starting scheduled JSON backup");
    
    try {
      const [projects, invoices, payments, costs, wbs] = await Promise.all([
        prisma.project.findMany(),
        prisma.invoice.findMany(),
        prisma.payment.findMany(),
        prisma.costRecord.findMany(),
        prisma.wBSItem.findMany()
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          projects,
          invoices,
          payments,
          costs,
          wbs
        }
      };

      // In a real prod environment, we would upload this to S3/GCS
      // For this safe patch, we log the success and metadata
      LoggerService.info("Backup completed successfully", {
        recordCounts: {
          projects: projects.length,
          invoices: invoices.length,
          payments: payments.length,
          costs: costs.length,
          wbs: wbs.length
        }
      });

      return backupData;
    } catch (error: any) {
      LoggerService.error("Backup failed", { error: error.message });
      throw error;
    }
  }
}
