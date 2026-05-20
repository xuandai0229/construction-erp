import { CostService } from '@/services/cost.service';
import { handleApiError, successResponse } from '@/lib/api-error';
import { assertAuthenticated, assertIsAccountant } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { headers } from "next/headers";

async function getServiceOptions(userId: string) {
  const head = await headers();
  return {
    userId,
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, version } = await request.json(); // nextStatus and client version check
    const authenticatedUser = await assertAuthenticated();
    
    // Security Guard: Only Accountants/CFOs/Admins can approve
    const user = await assertIsAccountant(authenticatedUser.id);

    // Verify record exists and belongs to the user's company (Tenant Isolation)
    const existing = await prisma.costRecord.findUnique({
      where: { id }
    });

    if (!existing || (user.companyId && existing.companyId !== user.companyId)) {
      throw new ApiError(404, "Không tìm thấy chi phí hoặc chi phí không thuộc công ty của bạn.");
    }

    // Dynamic Optimistic Concurrency check
    const currentVersion = existing.version;
    if (version !== undefined && version !== currentVersion) {
      throw new ApiError(409, `Lỗi tranh chấp dữ liệu (Optimistic Lock): Bản ghi đã được cập nhật bởi một người dùng khác. Phiên bản hiện tại: ${currentVersion}, phiên bản gửi lên: ${version}`);
    }

    const options = await getServiceOptions(user.id);
    const result = await CostService.transition(id, status, options);
    return successResponse(result, { correlationId: options.correlationId });
  } catch (error) {
    return handleApiError(error);
  }
}

