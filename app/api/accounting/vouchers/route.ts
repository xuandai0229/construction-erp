import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAccountingAccess } from "@/lib/route-security";
import { VoucherService } from "@/services/voucher.service";

export async function GET(request: Request) {
  try {
    await requireAccountingAccess("READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const result = await VoucherService.getVouchers({
      projectId,
      status,
      startDate,
      endDate,
      search,
      limit,
      skip
    });

    return NextResponse.json({
      success: true,
      data: result.vouchers,
      pagination: {
        total: result.totalCount,
        page,
        limit,
        totalPages: Math.ceil(result.totalCount / limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAccountingAccess("CREATE");
    const body = await request.json();

    const voucher = await VoucherService.saveVoucher(user.id, body);

    return NextResponse.json({
      success: true,
      message: "Lập chứng từ thành công",
      data: voucher
    });
  } catch (error) {
    return handleApiError(error);
  }
}
