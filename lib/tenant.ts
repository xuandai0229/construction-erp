import { AsyncLocalStorage } from "node:async_hooks";

export const tenantStorage = new AsyncLocalStorage<{ companyId?: string }>();

export function getTenantId() {
  return tenantStorage.getStore()?.companyId;
}

export function runWithTenant<T>(companyId: string, fn: () => Promise<T>): Promise<T> {
  return tenantStorage.run({ companyId }, fn);
}
