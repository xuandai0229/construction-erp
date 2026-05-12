import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Authorizer } from "@/lib/auth/authorize";
import { Permissions } from "@/lib/auth/permissions";
import { headers } from "next/headers";

export async function GET() {
  try {
    const head = await headers();
    const userId = head.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const head = await headers();
    const userId = head.get("x-user-id");
    const { id, role, status } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Security Guard
    await Authorizer.requirePermission(userId, Permissions.USERS_MANAGE);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role, status }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
