import { eventBus, EnterpriseEvent } from "@/lib/event-bus";
import { CacheService } from "../cache.service";
import { LoggerService } from "../logger.service";
import { ReconciliationEngine } from "./reconciliation.engine";

/**
 * FINANCIAL EVENT LISTENER
 * 
 * Enforces the "Snapshot Consistency" rule by invalidating affected report caches
 * whenever a significant financial event occurs.
 */
export function initializeFinancialListeners() {
  const financialEvents = [
    'COST_CREATED', 'COST_UPDATED', 'COST_DELETED',
    'COST_APPROVED', 'COST_REJECTED', 'COST_POSTED', 'COST_VOIDED',
    'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'INVOICE_APPROVED',
    'PAYMENT_CREATED', 'BUDGET_UPDATED', 'WBS_UPDATED', 'PERIOD_LOCKED',
    'PROJECT_UPDATED'
  ];

  financialEvents.forEach(type => {
    eventBus.subscribe(type, async (event: EnterpriseEvent) => {
      try {
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
        
        // 3. Background Reconciliation
        if (type === 'BUDGET_UPDATED' || type === 'COST_CREATED' || type === 'COST_UPDATED' || type === 'COST_DELETED') {
          // Fire and forget to not block the event loop
          ReconciliationEngine.reconcileBudget(projectId).catch(e => {
            LoggerService.error(`[ReconciliationEngine] Background job failed for ${projectId}`, { error: e });
          });
        }

      } catch (err) {
        LoggerService.error(`[FinancialListener] Failure in event subscriber for ${type}:`, { error: err, eventId: event.id });
      }
    });
  });
}
