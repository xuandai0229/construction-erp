import { RevenueRecord, InvoiceRecord, PaymentRecord, ServiceResponse } from '@/app/types';
import { mapRevenueFromApi, mapInvoiceFromApi, mapPaymentFromApi } from '@/lib/mappers/revenue.mapper';

export const revenueApi = {
  async getRevenuesByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<RevenueRecord[]>> {
    const res = await fetch(`/api/revenues?projectId=${projectId}`, { headers });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapRevenueFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getInvoicesByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<InvoiceRecord[]>> {
    const res = await fetch(`/api/invoices?projectId=${projectId}`, { headers });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapInvoiceFromApi) };
    }
    return { success: false, error: json.error };
  },

  async getPaymentsByProject(projectId: string, headers: any = {}): Promise<ServiceResponse<PaymentRecord[]>> {
    const res = await fetch(`/api/payments?projectId=${projectId}`, { headers });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.map(mapPaymentFromApi) };
    }
    return { success: false, error: json.error };
  },

  async createRevenue(data: any, headers: any = {}): Promise<ServiceResponse<RevenueRecord>> {
    const res = await fetch('/api/revenues', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async updateRevenue(id: string, updates: any, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/revenues/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async createInvoice(data: any, headers: any = {}): Promise<ServiceResponse<InvoiceRecord>> {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async createPayment(data: any, headers: any = {}): Promise<ServiceResponse<PaymentRecord>> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { success: json.success, data: json.data, error: json.error };
  },

  async deletePayment(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async updateInvoice(id: string, updates: any, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async updatePayment(id: string, updates: any, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/payments/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return { success: json.success, error: json.error };
  },

  async deleteInvoice(id: string, headers: any = {}): Promise<ServiceResponse<void>> {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE', headers });
    const json = await res.json();
    return { success: json.success, error: json.error };
  }
};
