import { NextResponse } from 'next/server';
import { RevenueService } from '@/services/revenue.service';
import { handleApiError, successResponse } from '@/lib/api-error';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const userId = request.headers.get("x-user-id") || undefined;
    
    const result = await RevenueService.updateInvoiceApproval(id, status, userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
