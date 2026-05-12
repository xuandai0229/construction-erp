import { Project } from '@/app/types';

export function mapProjectFromApi(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    status: p.status,
    ownerId: p.ownerId ?? null,
    investor: p.investor || "Chưa có thông tin",
    projectType: p.projectType || null,
    contractValue: Number(p.contractValue ?? 0),
    totalBudget: Number(p.totalBudget ?? 0),
    totalValue: Number(p.contractValue ?? 0), // Alias for UI compatibility
    startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
    endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
    deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString() : null,
  };
}

export function mapProjectToApi(p: Partial<Project>) {
  return {
    name: p.name,
    description: p.description,
    status: p.status,
    ownerId: p.ownerId,
    investor: p.investor,
    projectType: p.projectType,
    contractValue: p.contractValue ?? p.totalValue, // Support both fields
    totalBudget: p.totalBudget,
    startDate: p.startDate,
    endDate: p.endDate,
  };
}
