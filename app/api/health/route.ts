import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Construction ERP",
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
    uptime: process.uptime ? process.uptime() : undefined
  });
}
