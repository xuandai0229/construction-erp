import { prisma } from "@/lib/prisma";
import { CostService, ServiceOptions } from "../cost.service";
import { CostWorkflowState } from "@/lib/workflow/costWorkflow";
import { LoggerService } from "../logger.service";

interface BulkResult {
  successful: string[];
  failed: { id: string; error: string }[];
}

/**
 * Enterprise Bulk Operations Service
 * Processes multiple financial records with Transaction-safe and Audit-safe boundaries.
 */
export class BulkService {
  /**
   * Bulk Approve Costs
   */
  static async bulkApproveCosts(ids: string[], options: ServiceOptions): Promise<BulkResult> {
    return this.processBulkTransition(ids, "APPROVED", options);
  }

  /**
   * Bulk Post Costs to Ledger
   */
  static async bulkPostCosts(ids: string[], options: ServiceOptions): Promise<BulkResult> {
    return this.processBulkTransition(ids, "POSTED", options);
  }

  private static async processBulkTransition(
    ids: string[], 
    nextState: CostWorkflowState, 
    options: ServiceOptions
  ): Promise<BulkResult> {
    const result: BulkResult = { successful: [], failed: [] };

    // We process sequentially to ensure individual audit trails and robust error handling
    // In a massive scale system, this would be chunked and run in a Job Queue
    for (const id of ids) {
      try {
        await CostService.transition(id, nextState, options);
        result.successful.push(id);
      } catch (error: any) {
        LoggerService.warn(`[BulkService] Failed to transition cost ${id} to ${nextState}`, { error: error.message });
        result.failed.push({ id, error: error.message || 'Lỗi không xác định' });
      }
    }

    return result;
  }
}
