"use server";

import { InvoiceRecord, InvoiceResponse, ServiceResponse } from '@/app/types';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

/**
 * Get all invoices for a project from Supabase
 */
export async function getInvoices(projectId: string): Promise<ServiceResponse<InvoiceRecord[]>> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_id', projectId)
    .order('issued_date', { ascending: false });

  if (error) {
    console.error('[SERVICE ERROR] getInvoices:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as InvoiceRecord[] || [] };
}

/**
 * Add a new invoice record
 */
export async function addInvoice(
  projectId: string,
  amount: number,
  issuedDate: string
): Promise<ServiceResponse<InvoiceRecord>> {
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
    console.error('[SERVICE ERROR] addInvoice:', error.message);
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
  projectId: string,
  id: string,
  updates: Partial<InvoiceRecord>
): Promise<ServiceResponse<InvoiceRecord>> {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('project_id', projectId) // 🔒 Prevent cross-project updates
    .select()
    .single();

  if (error) {
    console.error('[SERVICE ERROR] updateInvoice:', error.message);
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
export async function deleteInvoice(projectId: string, id: string): Promise<ServiceResponse<void>> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId); // 🔒 Prevent cross-project deletes

  if (error) {
    console.error('[SERVICE ERROR] deleteInvoice:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
