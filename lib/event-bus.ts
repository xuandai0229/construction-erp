import { EventEmitter } from 'events';
import { MetricsCollector } from './metrics';

export type EnterpriseEvent = {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  metadata: {
    userId?: string;
    projectId?: string;
    companyId?: string;
  };
};

class EnterpriseEventBus extends EventEmitter {
  private static instance: EnterpriseEventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance() {
    if (!this.instance) this.instance = new EnterpriseEventBus();
    return this.instance;
  }

  async publish(event: Omit<EnterpriseEvent, 'id' | 'timestamp'>) {
    MetricsCollector.recordEventDispatched();
    const fullEvent: EnterpriseEvent = {
      ...event,
      id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    console.log(`[EventBus] Publishing: ${fullEvent.type} (${fullEvent.id})`);
    
    // PERSISTENT OUTBOX: Save to DB before emitting in-memory
    // This ensures event reliability even on server restart
    try {
      const { prisma } = require('./prisma');
      const eventModel = (prisma as any).domainEvent;
      
      if (eventModel) {
        await eventModel.create({
          data: {
            id: fullEvent.id,
            type: fullEvent.type,
            payload: fullEvent.payload,
            metadata: fullEvent.metadata,
            projectId: (fullEvent.metadata as any)?.projectId,
            timestamp: fullEvent.timestamp,
            status: "PENDING"
          }
        });
      } else {
        console.warn(`[EventBus] Skipping event persistence: DomainEvent model not available in Prisma Client.`);
      }
    } catch (dbErr) {
      console.error(`[EventBus] Failed to persist event ${fullEvent.id}:`, dbErr);
      // We still emit in-memory but trace the failure
    }

    this.emit(fullEvent.type, fullEvent);
    this.emit('*', fullEvent); // Global listener
  }

  subscribe(type: string, handler: (event: EnterpriseEvent) => void) {
    this.on(type, handler);
  }
}

export const eventBus = EnterpriseEventBus.getInstance();

if (typeof window === 'undefined') {
  // Auto-initialize financial runtime listeners (Server-side)
  try {
    const { initializeFinancialListeners } = require('../services/finance/financial-event-listener');
    initializeFinancialListeners();
  } catch (err) {
    console.warn('[EventBus] Failed to initialize financial listeners:', err);
  }

  // Initialize CQRS Read Model Projectors (Server-side)
  try {
    const { ReadModelProjector } = require('../services/cqrs/read-model.projector');
    ReadModelProjector.init();
  } catch (err) {
    console.warn('[EventBus] Failed to initialize CQRS read model projector:', err);
  }

  // Automatic Background Job Polling Worker (Runs every 3 seconds)
  const POLLING_INTERVAL_MS = 3000;
  let runCount = 0;
  setInterval(async () => {
    runCount++;
    try {
      const { ResilientQueueService } = require('../services/queue/resilient-queue.service');
      await ResilientQueueService.pollAndProcess();
      
      // Sweep for stuck jobs every 30 seconds
      if (runCount % 10 === 0) {
        await ResilientQueueService.recoverStuckJobs();
      }
    } catch (err) {
      // Quietly suppress to prevent server spam
    }
  }, POLLING_INTERVAL_MS);
}
