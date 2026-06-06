import { prisma } from "./prisma";
import { ApiError } from "./api-error";

export async function getTenantContext(userId: string | undefined) {
  if (!userId) throw new ApiError(401, "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user || !user.companyId) throw new ApiError(403, "Tài khoản chưa được gắn với doanh nghiệp nào.");

  return {
    companyId: user.companyId
  };
}

/**
 * Validates if the target entity belongs to the user's company.
 */
export async function assertTenantAccess(userId: string | undefined, entityCompanyId: string | null) {
  const context = await getTenantContext(userId);
  if (entityCompanyId !== context.companyId) {
    throw new ApiError(403, "Bạn không có quyền truy cập dữ liệu của doanh nghiệp này.");
  }
}
