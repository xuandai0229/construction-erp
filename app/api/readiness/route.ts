import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const checks: any[] = [];
  let isReady = true;

  // Check 1: Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "Database Connection", status: "ok" });
  } catch (error) {
    checks.push({ name: "Database Connection", status: "error" });
    isReady = false;
  }

  // Check 2: Required Environment Variables
  const requiredEnvs = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length === 0) {
    checks.push({ name: "Environment Variables", status: "ok" });
  } else {
    checks.push({ name: "Environment Variables", status: "error" });
    isReady = false;
  }

  // Require SUPER_ADMIN or internal token to see details, otherwise just return status
  const authHeader = request.headers.get("Authorization");
  const isAuthorized = authHeader === `Bearer ${process.env.INTERNAL_API_TOKEN || "SECRET_DEV_TOKEN_123"}`;

  if (!isAuthorized) {
    return NextResponse.json({
      ready: isReady
    }, { status: isReady ? 200 : 503 });
  }

  return NextResponse.json({
    ready: isReady,
    checks: checks,
    timestamp: new Date().toISOString()
  }, { status: isReady ? 200 : 503 });
}
