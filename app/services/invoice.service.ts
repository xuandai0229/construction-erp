// ============================================
// INVOICE SERVICE - SUPABASE DATA LAYER
// ============================================

import { InvoiceRecord, InvoiceResponse } from '@/app/types';
import { supabase } from '@/app/utils/supabase';

/**
 * Get all invoices for a project from Supabase
 */
export async function getInvoices(projectId: string): Promise<InvoiceRecord[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_id', projectId)
    .order('issued_date', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
  return data as InvoiceRecord[];
}

/**
 * Add a new invoice record
 */
export async function addInvoice(
  projectId: string,
  amount: number,
  issuedDate: string
): Promise<InvoiceResponse> {
  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        project_id: projectId,
        amount,
        issued_date: issuedDate,
        paid_amount: 0,
        remaining_amount: amount,
        status: 'issued'
      }
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as InvoiceRecord,
  };
}

/**
 * Update an existing invoice record
 */
export async function updateInvoice(
  id: string,
  updates: Partial<InvoiceRecord>
): Promise<InvoiceResponse> {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as InvoiceRecord,
  };
}

/**
 * Delete an invoice record
 */
export async function deleteInvoice(id: string): Promise<InvoiceResponse> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
