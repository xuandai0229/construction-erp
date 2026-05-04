import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";
import { updateProjectSchema } from "@/lib/validations";
import { handleApiError, successResponse } from "@/lib/api-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await ProjectService.findById(id);
    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);
    
    const project = await ProjectService.update(id, validatedData);
    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ProjectService.delete(id);
    return successResponse({ message: "Project deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
