import { ProjectService } from "@/services/project.service";
import { updateProjectSchema } from "@/lib/validations";
import { ApiError, handleApiError, successResponse } from "@/lib/api-error";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

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
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "PROJECT", "UPDATE");

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    if (user.companyId) {
      const project = await prisma.project.findFirst({ where: { id, companyId: user.companyId, deletedAt: null }, select: { id: true } });
      if (!project) throw new ApiError(404, "Project not found for current tenant.");
    }
    
    const project = await ProjectService.update(id, validatedData, user.id);
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
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "PROJECT", "DELETE");

    const { id } = await params;
    if (user.companyId) {
      const project = await prisma.project.findFirst({ where: { id, companyId: user.companyId, deletedAt: null }, select: { id: true } });
      if (!project) throw new ApiError(404, "Project not found for current tenant.");
    }

    await ProjectService.delete(id, user.id);
    return successResponse({ message: "Project deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
