import { NextResponse } from "next/server";
import { TaskService } from "@/services/task.service";
import { createTaskSchema } from "@/lib/validations";
import { handleApiError, successResponse } from "@/lib/api-error";
import { TaskStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.has("page") ? Number(searchParams.get("page") ?? 1) : undefined;
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit") ?? 20) : undefined;
    const search = searchParams.get("search") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;
    const status = (searchParams.get("status") as TaskStatus) || undefined;
    const orderBy = (searchParams.get("orderBy") as any) || undefined;
    const orderDir = (searchParams.get("orderDir") as any) || undefined;

    const { data, metadata } = await TaskService.findMany({ 
      page, limit, search, projectId, assigneeId, status, orderBy, orderDir 
    });
    return successResponse(data, metadata);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);
    
    const task = await TaskService.create(validatedData);
    return successResponse(task, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
