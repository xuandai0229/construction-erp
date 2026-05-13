import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Authorizer } from "@/lib/auth/authorize";
import { Permissions } from "@/lib/auth/permissions";
import { headers } from "next/headers";
import { handleApiError, successResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const head = await headers();
    const userId = head.get("x-user-id");

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Security Guard: Only SUPER_ADMIN or those with USERS_VIEW can see list
    await Authorizer.requirePermission(userId, Permissions.USERS_VIEW);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    return successResponse(users);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const head = await headers();
    const userId = head.get("x-user-id");
    const { id, role } = await req.json();

    if (!userId) throw new Error("Unauthorized");

    // Security Guard
    await Authorizer.requirePermission(userId, Permissions.USERS_MANAGE);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return successResponse(updatedUser);
  } catch (error: any) {
    return handleApiError(error);
  }
}
