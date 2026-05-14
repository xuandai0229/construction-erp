import { handleApiError, successResponse } from "@/lib/api-error";
import { ProjectService } from "@/services/project.service";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations";
import { assertValidEntity } from "@/lib/assertion";
import { ProjectStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");
    const orderByParam = searchParams.get("orderBy");
    const orderDirParam = searchParams.get("orderDir");

    const page = (pageParam && pageParam !== "undefined") ? Number(pageParam) : 1;
    const limit = (limitParam && limitParam !== "undefined") ? Number(limitParam) : 10;
    const search = (searchParam && searchParam !== "undefined" && searchParam !== "") ? searchParam : undefined;
    const status = (statusParam && statusParam !== "undefined" && statusParam !== "") ? (statusParam as ProjectStatus) : undefined;
    const orderBy = (orderByParam && orderByParam !== "undefined") ? (orderByParam as any) : "createdAt";
    const orderDir = (orderDirParam && orderDirParam !== "undefined") ? (orderDirParam as any) : "desc";

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
    
    const userId = "system_internal_admin";
    const project = await ProjectService.create(validatedData, userId);
    return successResponse(project, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
