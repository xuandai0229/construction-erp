import { WBSItem } from '@/app/types';

export function mapWBSFromApi(raw: any): WBSItem {
  return {
    id: raw.id,
    projectId: raw.projectId,
    name: raw.name,
    code: raw.code ?? null,
    parentId: raw.parentId ?? null,
    level: raw.level ?? 0,
    sortOrder: raw.sortOrder ?? 0,
    budgetAmount: Number(raw.budgetAmount ?? 0),
    createdAt: new Date(raw.createdAt).toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapWBSToApi(w: Partial<WBSItem>) {
  return {
    projectId: w.projectId,
    name: w.name,
    code: w.code,
    parentId: w.parentId,
    sortOrder: w.sortOrder,
  };
}
