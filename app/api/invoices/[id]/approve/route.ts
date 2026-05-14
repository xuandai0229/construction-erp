import { NextResponse } from 'next/server';
import { RevenueService } from '@/services/revenue.service';
import { handleApiError, successResponse } from '@/lib/api-error';

import { assertIsManager } from '@/lib/auth-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const userId = "system_internal_admin";

    // Security Guard: Only Managers/Admins can approve
    await assertIsManager(userId);
    
    const result = await RevenueService.updateInvoiceApproval(id, status, userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
