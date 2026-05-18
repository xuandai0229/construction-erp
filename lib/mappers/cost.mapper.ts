import { CostRecord, BudgetRecord } from '@/app/types';

export function mapCostFromApi(c: any): CostRecord {
  const amount = Number(c.amount);
  const vatRate = c.vatRate !== undefined && c.vatRate !== null ? Number(c.vatRate) : 10;
  const retentionRate = c.retentionRate !== undefined && c.retentionRate !== null ? Number(c.retentionRate) : 0;
  
  // Safe back-calculations for legacy database rows
  const netAmount = c.netAmount !== undefined && c.netAmount !== null ? Number(c.netAmount) : (amount / (1 + vatRate / 100));
  const vatAmount = c.vatAmount !== undefined && c.vatAmount !== null ? Number(c.vatAmount) : (amount - netAmount);
  const retentionAmount = c.retentionAmount !== undefined && c.retentionAmount !== null ? Number(c.retentionAmount) : (amount * (retentionRate / 100));

  return {
    id: c.id,
    projectId: c.projectId,
    wbsId: c.wbsId,
    costType: c.costType,
    amount: amount,
    quantity: Number(c.quantity ?? 1),
    unitPrice: Number(c.unitPrice ?? 0),
    supplier: c.supplier ?? null,
    note: c.note ?? null,
    date: c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
    status: c.status,
    createdById: c.createdById ?? null,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    workflowStatus: c.workflowStatus || "DRAFT",
    approvalStatus: c.approvalStatus || "DRAFT",
    vatRate,
    vatAmount,
    netAmount,
    retentionRate,
    retentionAmount,
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

export function mapCostToApi(c: any) {
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
    requestId: c.requestId,
    vatRate: c.vatRate !== undefined && c.vatRate !== null ? Number(c.vatRate) : undefined,
    retentionRate: c.retentionRate !== undefined && c.retentionRate !== null ? Number(c.retentionRate) : undefined,
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
