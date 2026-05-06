import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

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
    const errorMessages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(", ");
    return NextResponse.json(
      { success: false, error: `Lỗi dữ liệu: ${errorMessages}` },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Dữ liệu đã tồn tại (Duplicate entry)' }, { status: 400 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'Vi phạm ràng buộc dữ liệu (Foreign key violation)' }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dữ liệu liên quan' }, { status: 404 });
    }
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
