import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const errorMessages = (error as any).errors.map((e: any) => e.message).join(", ");
    return NextResponse.json(
      { success: false, error: `Validation Error: ${errorMessages}` },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  console.error("[Unhandled API Error]:", error);
  return NextResponse.json(
    { success: false, error: "Internal Server Error" },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, metadata?: any, status = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(metadata && { metadata }),
  };
  return NextResponse.json(payload, { status });
}
