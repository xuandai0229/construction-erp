import { TaskService } from "@/services/task.service";
import { updateTaskSchema } from "@/lib/validations";
import { handleApiError, successResponse } from "@/lib/api-error";
import { requireProjectPermission } from "@/lib/route-security";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await TaskService.findById(id);
    await requireProjectPermission(task.projectId, "PROJECT", "READ");
    return successResponse(task);
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
    const existing = await TaskService.findById(id);
    await requireProjectPermission(existing.projectId, "PROJECT", "UPDATE");
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);
    
    const task = await TaskService.update(id, validatedData);
    return successResponse(task);
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
    const existing = await TaskService.findById(id);
    await requireProjectPermission(existing.projectId, "PROJECT", "UPDATE");
    await TaskService.delete(id);
    return successResponse({ message: "Task deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
