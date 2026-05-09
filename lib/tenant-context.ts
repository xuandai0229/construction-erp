import { prisma } from "./prisma";
import { ApiError } from "./api-error";

export async function getTenantContext(userId: string | undefined) {
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });

  if (!user || !user.companyId) throw new ApiError(403, "User does not belong to any company");

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
    throw new ApiError(403, "Access Denied: Tenant Isolation Violation");
  }
}
