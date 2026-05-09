import { prisma } from "./prisma";
import { UserRole } from "../generated/prisma-client";
import { ApiError } from "./api-error";

export async function assertHasRole(userId: string | undefined, allowedRoles: UserRole[]) {
  if (!userId) throw new ApiError(401, "Unauthorized: Missing User ID");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) throw new ApiError(404, "User not found");
  
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, `Forbidden: Requires one of [${allowedRoles.join(", ")}] roles. Current: ${user.role}`);
  }

  return user;
}

export async function assertIsAdmin(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.ADMIN]);
}

export async function assertIsManager(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.ADMIN, UserRole.MANAGER]);
}

export async function assertIsAccountant(userId: string | undefined) {
  return assertHasRole(userId, [UserRole.ADMIN, UserRole.ACCOUNTANT]);
}
