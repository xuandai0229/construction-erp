import { RevenueRecord, InvoiceRecord, PaymentRecord } from '@/app/types';

function safeISO(date: any): string {
  if (!date) return new Date().toISOString();
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function safeISOOrNull(date: any): string | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function mapRevenueFromApi(r: any): RevenueRecord {
  return {
    id: r.id,
    projectId: r.projectId,
    wbsId: r.wbsId,
    invoiceId: r.invoiceId ?? null,
    amount: Number(r.amount),
    date: safeISO(r.date),
    status: r.status,
    description: r.description ?? null,
    createdById: r.createdById ?? null,
    createdAt: safeISO(r.createdAt),
    updatedAt: safeISO(r.updatedAt),
  };
}

export function mapInvoiceFromApi(i: any): InvoiceRecord {
  return {
    id: i.id,
    projectId: i.projectId,
    wbsId: i.wbsId,
    invoiceNumber: i.invoiceNumber ?? null,
    amount: Number(i.amount),
    issuedDate: safeISO(i.issuedDate),
    dueDate: safeISOOrNull(i.dueDate),
    paidAmount: Number(i.paidAmount ?? 0),
    remainingAmount: Number(i.remainingAmount ?? i.amount),
    status: i.status,
    note: i.note ?? null,
    createdById: i.createdById ?? null,
    createdAt: safeISO(i.createdAt),
    updatedAt: safeISO(i.updatedAt),
  };
}

export function mapPaymentFromApi(p: any): PaymentRecord {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    projectId: p.projectId,
    amount: Number(p.amount),
    date: safeISO(p.date),
    description: p.description ?? null,
    createdAt: safeISO(p.createdAt),
    updatedAt: safeISO(p.updatedAt),
  };
}

export function mapRevenueToApi(r: Partial<RevenueRecord>) {
  return {
    projectId: r.projectId,
    wbsId: r.wbsId,
    invoiceId: r.invoiceId,
    amount: r.amount,
    date: r.date,
    status: r.status,
    description: r.description,
  };
}

export function mapInvoiceToApi(i: Partial<InvoiceRecord>) {
  return {
    projectId: i.projectId,
    wbsId: i.wbsId,
    invoiceNumber: i.invoiceNumber,
    amount: i.amount,
    issuedDate: i.issuedDate,
    dueDate: i.dueDate,
    status: i.status,
    note: i.note,
  };
}

export function mapPaymentToApi(p: Partial<PaymentRecord>) {
  return {
    projectId: p.projectId,
    invoiceId: p.invoiceId,
    amount: p.amount,
    date: p.date,
    description: p.description,
  };
}
