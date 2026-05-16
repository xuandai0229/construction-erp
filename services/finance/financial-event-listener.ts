import { eventBus, EnterpriseEvent } from "@/lib/event-bus";
import { CacheService } from "../cache.service";
import { LoggerService } from "../logger.service";

/**
 * FINANCIAL EVENT LISTENER
 * 
 * Enforces the "Snapshot Consistency" rule by invalidating affected report caches
 * whenever a significant financial event occurs.
 */
export function initializeFinancialListeners() {
  const financialEvents = [
    'COST_APPROVED', 'COST_REJECTED', 'COST_POSTED', 'COST_VOIDED',
    'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE',
    'BUDGET_UPDATED', 'WBS_UPDATED', 'PERIOD_LOCKED'
  ];

  financialEvents.forEach(type => {
    eventBus.subscribe(type, async (event: EnterpriseEvent) => {
      const { projectId } = event.metadata;
      
      LoggerService.info(`[FinancialListener] Invalidate cache for ${type}`, { projectId });

      // 1. Invalidate Project Specific Caches
      if (projectId) {
        await CacheService.invalidatePrefix(`reporting:${projectId}`);
        await CacheService.invalidatePrefix(`wbs:${projectId}`);
        await CacheService.invalidatePrefix(`aggregation:${projectId}`);
      }

      // 2. Invalidate Global Reporting Caches
      await CacheService.invalidatePrefix('reporting:risk_profiles');
      await CacheService.invalidatePrefix('reporting:management_scorecard');
      
      // 3. Mark for Reconciliation (In a real app, this might queue a job)
      console.log(`[Reconciliation] Flagging project ${projectId || 'GLOBAL'} for verification.`);
    });
  });
}
