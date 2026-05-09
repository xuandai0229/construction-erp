import { EventEmitter } from 'events';

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

  publish(event: Omit<EnterpriseEvent, 'id' | 'timestamp'>) {
    const fullEvent: EnterpriseEvent = {
      ...event,
      id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    console.log(`[EventBus] Publishing: ${fullEvent.type} (${fullEvent.id})`);
    this.emit(fullEvent.type, fullEvent);
    this.emit('*', fullEvent); // Global listener
  }

  subscribe(type: string, handler: (event: EnterpriseEvent) => void) {
    this.on(type, handler);
  }
}

export const eventBus = EnterpriseEventBus.getInstance();
