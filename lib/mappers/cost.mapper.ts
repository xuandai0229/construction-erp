import { CostRecord, BudgetRecord } from '@/app/types';

export function mapCostFromApi(c: any): CostRecord {
  return {
    id: c.id,
    projectId: c.projectId,
    wbsId: c.wbsId,
    costType: c.costType,
    amount: Number(c.amount),
    quantity: Number(c.quantity ?? 1),
    unitPrice: Number(c.unitPrice ?? 0),
    supplier: c.supplier ?? null,
    note: c.note ?? null,
    date: c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
    status: c.status,
    createdById: c.createdById ?? null,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapBudgetFromApi(b: any): BudgetRecord {
  return {
    id: b.id,
    projectId: b.projectId,
    wbsId: b.wbsId,
    costType: b.costType,
    estimatedAmount: Number(b.estimatedAmount),
    createdById: b.createdById ?? null,
    createdAt: new Date(b.createdAt).toISOString(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapCostToApi(c: Partial<CostRecord>) {
  return {
    projectId: c.projectId,
    wbsId: c.wbsId,
    costType: c.costType,
    amount: c.amount,
    quantity: c.quantity,
    unitPrice: c.unitPrice,
    supplier: c.supplier,
    note: c.note,
    date: c.date,
    status: c.status,
  };
}

export function mapBudgetToApi(b: Partial<BudgetRecord>) {
  return {
    projectId: b.projectId,
    wbsId: b.wbsId,
    costType: b.costType,
    estimatedAmount: b.estimatedAmount,
  };
}
