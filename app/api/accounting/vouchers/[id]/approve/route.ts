import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/route-security";
import { VoucherService } from "@/services/voucher.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("VOUCHER", "APPROVE");
    const { id } = await params;
    const head = await headers();
    const body = await request.json().catch(() => ({}));

    const voucher = await VoucherService.approveVoucher(user.id, id, {
      ipAddress: head.get("x-forwarded-for") || undefined,
      userAgent: head.get("user-agent") || undefined,
      correlationId: head.get("x-request-id") || undefined,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, message: "Duyet chung tu thanh cong", data: voucher });
  } catch (error) {
    return handleApiError(error);
  }
}
