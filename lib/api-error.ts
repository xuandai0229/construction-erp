import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma-client";
import { LoggerService } from "@/services/logger.service";
import { headers } from "next/headers";

export class ApiError extends Error {
  statusCode: number;
  metadata?: any;

  constructor(statusCode: number, message: string, metadata?: any) {
    super(message);
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.name = "ApiError";
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export async function handleApiError(error: unknown) {
  const head = await headers();
  const requestId = head.get("x-request-id") || undefined;
  const userId = head.get("x-user-id") || undefined;

  if (error instanceof ZodError) {
    const errorMessages = error.issues?.map((e) => `${e.path.join('.')}: ${e.message}`).join(", ") || "Lỗi validation không xác định";
    LoggerService.warn("Validation Error", { requestId, userId, error: errorMessages });
    return NextResponse.json(
      { success: false, error: `Lỗi dữ liệu: ${errorMessages}` },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    LoggerService.warn(error.message, { requestId, userId, statusCode: error.statusCode, metadata: error.metadata });
    return NextResponse.json(
      { success: false, error: error.message, metadata: error.metadata },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    LoggerService.error("Prisma Error", { requestId, userId, errorCode: error.code, error: error.message });
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Dữ liệu đã tồn tại trong hệ thống' }, { status: 400 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'Vi phạm ràng buộc dữ liệu liên kết' }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dữ liệu yêu cầu' }, { status: 404 });
    }
  }

  LoggerService.error("Unhandled Internal Server Error", { requestId, userId, error: (error as any)?.message || error });
  return NextResponse.json(
    { success: false, error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau hoặc liên hệ quản trị viên." },
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
