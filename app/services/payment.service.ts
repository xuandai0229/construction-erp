// ============================================
// PAYMENT SERVICE - SUPABASE DATA LAYER
// ============================================

import { PaymentRecord, PaymentResponse } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all payments for a project from Supabase
 */
export async function getPayments(projectId: string): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  return data as PaymentRecord[];
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
): Promise<PaymentResponse> {
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
  id: string,
  updates: Partial<Omit<PaymentRecord, 'id' | 'created_at'>>
): Promise<PaymentResponse> {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
export async function deletePayment(id: string): Promise<PaymentResponse> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete all payments for a specific invoice
 */
export async function deletePaymentsByInvoice(invoiceId: string): Promise<PaymentResponse> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('invoice_id', invoiceId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
