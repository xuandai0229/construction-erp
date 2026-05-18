import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionManager } from "@/lib/session";
import { UserRole } from "../../../../generated/prisma-client";

const DEV_ONLY_MESSAGE = "Development session bootstrap is disabled outside development/test.";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, error: DEV_ONLY_MESSAGE }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : undefined;
  const requestedRole = typeof body.role === "string" ? body.role : "SUPER_ADMIN";

  let user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email || "dev.superadmin@erp.local",
        name: "Development Super Admin",
        role: requestedRole in UserRole ? requestedRole as UserRole : UserRole.SUPER_ADMIN,
      },
    });
  }

  const token = SessionManager.createSession(user.id, user.role);
  const response = NextResponse.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    },
  });

  response.cookies.set("erp-session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  return response;
}
