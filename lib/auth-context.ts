import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export interface UserContext {
  id: string;
  role: UserRole;
}

/**
 * PHASE 4: Auth Context Helper
 * Simulates user extraction from session/headers.
 */
export function getUserContext(request: Request): UserContext {
  // In a real production app, we would verify JWT here.
  // For this development phase, we'll look for custom headers or default to a safe role.
  const userId = request.headers.get("x-user-id") || "system-user";
  const userRole = (request.headers.get("x-user-role") as UserRole) || UserRole.VIEWER;

  return {
    id: userId,
    role: userRole,
  };
}
