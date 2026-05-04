"use server";

import { PaymentRecord, PaymentResponse, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all payments for a project from Supabase
 */
export async function getPayments(projectId: string): Promise<ServiceResponse<PaymentRecord[]>> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[SERVICE ERROR] getPayments:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as PaymentRecord[] || [] };
}

/**
 * Add a new payment record
 */
export async function addPayment(
  projectId: string,
  invoiceId: string,
  amount: number,
  date: string,
  description: string = ''
): Promise<ServiceResponse<PaymentRecord>> {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        project_id: projectId,
        invoice_id: invoiceId,
        amount,
        date,
        description
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] addPayment:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as PaymentRecord,
  };
}

/**
 * Update an existing payment record
 */
export async function updatePayment(
  projectId: string,
  id: string,
  updates: Partial<Omit<PaymentRecord, 'id' | 'created_at'>>
): Promise<ServiceResponse<PaymentRecord>> {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .eq('project_id', projectId) // 🔒 Prevent cross-project updates
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updatePayment:', error.message);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as PaymentRecord,
  };
}

/**
 * Delete a payment record
 */
export async function deletePayment(id: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SERVICE ERROR] deletePayment:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete all payments for a specific invoice
 */
export async function deletePaymentsByInvoice(invoiceId: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('invoice_id', invoiceId);

  if (error) {
    console.error('[SERVICE ERROR] deletePaymentsByInvoice:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
