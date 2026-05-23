import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { LoggerService } from "./logger.service";

export class ImportService {
  static async importCosts(projectId: string, data: any[], userId?: string) {
    LoggerService.info("Starting batch cost import", { projectId, recordCount: data.length });
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        try {
          // Simple validation
          if (!row.amount || !row.wbsId) {
            throw new Error("Missing mandatory fields (amount, wbsId)");
          }

          await tx.costRecord.create({
            data: {
              projectId,
              wbsId: row.wbsId,
              amount: Number(row.amount),
              costType: row.costType || "material",
              note: row.note || "Imported",
              date: row.date ? new Date(row.date) : new Date(),
              createdById: userId
            }
          });
          results.success++;
        } catch (e: any) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${e.message}`);
        }
      }
    });

    LoggerService.info("Import completed", { success: results.success, failed: results.failed });
    return results;
  }
}
