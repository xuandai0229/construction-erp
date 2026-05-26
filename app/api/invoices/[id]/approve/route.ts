import { RevenueService } from '@/services/revenue.service';
import { handleApiError, successResponse, ApiError } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';
import { requireProjectPermission } from '@/lib/route-security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const invoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      select: { projectId: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    const user = await requireProjectPermission(invoice.projectId, "INVOICE", "APPROVE");
    
    const result = await RevenueService.updateInvoiceApproval(id, status, user.id);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
