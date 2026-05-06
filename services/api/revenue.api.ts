import { RevenueRecord, InvoiceRecord, PaymentRecord, ServiceResponse } from '@/app/types';
import { mapRevenueFromApi, mapInvoiceFromApi, mapPaymentFromApi } from '@/lib/mappers/revenue.mapper';

export const revenueApi = {
  async getRevenuesByProject(projectId: string): Promise<ServiceResponse<RevenueRecord[]>> {
    const res = await fetch(`/api/revenues?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapRevenueFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getInvoicesByProject(projectId: string): Promise<ServiceResponse<InvoiceRecord[]>> {
    const res = await fetch(`/api/invoices?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapInvoiceFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getPaymentsByProject(projectId: string): Promise<ServiceResponse<PaymentRecord[]>> {
    const res = await fetch(`/api/payments?projectId=${projectId}`);
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapPaymentFromApi) };
    }
    return { success: false, error: json.error };
  },

  async createRevenue(data: any): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/revenues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: data.projectId,
        wbs_id: data.wbsId,
        amount: data.amount,
        status: data.status,
        description: data.description,
        date: data.date
      }),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async updateRevenue(id: string, updates: any): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/revenues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async createInvoice(data: any): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: data.projectId,
        wbs_id: data.wbsId,
        amount: data.amount,
        issued_date: data.issuedDate
      }),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async deleteInvoice(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async createPayment(data: any): Promise<ServiceResponse<void>> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: data.projectId,
        invoice_id: data.invoiceId,
        amount: data.amount,
        date: data.date,
        description: data.description
      }),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async deletePayment(id: string): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return { success: json.success, error: json.error };
  }
};
