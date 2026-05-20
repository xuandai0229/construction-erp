import { NextResponse } from 'next/server';
import { RevenueService } from '@/services/revenue.service';
import { handleApiError, successResponse } from '@/lib/api-error';

import { assertAuthenticated, assertIsManager } from '@/lib/auth-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const user = await assertAuthenticated();

    // Security Guard: Only Managers/Admins can approve
    await assertIsManager(user.id);
    
    const result = await RevenueService.updateInvoiceApproval(id, status, user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
