import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { PaymentService } from "@/services/payment.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "COST", "UPDATE"); // Hoặc quyền riêng cho PAYMENT nếu có

    const { id } = await params;
    const body = await request.json();
    
    // amount, paymentDate, note, reference
    const vp = await PaymentService.createVendorPayment({
      costRecordId: id,
      amount: body.amount,
      paymentDate: body.paymentDate,
      note: body.note,
      reference: body.reference
    }, user.id);

    return successResponse(vp);
  } catch (error) {
    return handleApiError(error);
  }
}
