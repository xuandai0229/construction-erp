import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { ProjectStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.has("page") ? Number(searchParams.get("page") ?? 1) : undefined;
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit") ?? 10) : undefined;
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as ProjectStatus) || undefined;
    const orderBy = (searchParams.get("orderBy") as any) || undefined;
    const orderDir = (searchParams.get("orderDir") as any) || undefined;

    const { data, metadata } = await ProjectService.findMany({ 
      page, limit, search, status, orderBy, orderDir 
    });
    
    return successResponse(data, metadata);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);
    assertValidEntity(validatedData, "CreateProjectDTO");
    
    const userId = request.headers.get("x-user-id") || undefined;
    const project = await ProjectService.create(validatedData, userId);
    return successResponse(project, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
