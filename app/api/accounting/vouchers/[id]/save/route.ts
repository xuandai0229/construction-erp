import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";
import { VoucherService } from "@/services/voucher.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAccountingAccess("UPDATE");
    const { id } = await params;
    const body = await request.json();

    const voucher = await VoucherService.saveVoucher(user.id, {
      ...body,
      id
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật chứng từ thành công",
      data: voucher
    });
  } catch (error) {
    return handleApiError(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAccountingAccess("DELETE");
    const { id } = await params;

    const result = await VoucherService.deleteVoucher(user.id, id);

    return NextResponse.json({
      success: true,
      message: "Xóa chứng từ thành công",
      data: result
    });
  } catch (error) {
    return handleApiError(error);
  }
}
