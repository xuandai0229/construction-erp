import { cookies } from "next/headers";
import { SessionManager } from "@/lib/session";
import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { createBudgetSchema } from "@/lib/validations";
import { BudgetService } from "@/services/budget.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || searchParams.get("project_id");
    if (!projectId) {
      throw new ApiError(400, "Vui lòng cung cấp projectId");
    }

    const items = await BudgetService.findByProject(projectId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = items.map((b: any) => ({
      id: b.id,
      projectId: b.projectId,
      wbsId: b.wbsId,
      wbsName: b.wbs?.name,
      costType: b.costType,
      estimatedAmount: b.estimatedAmount,
      createdAt: b.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("erp-session")?.value;
    const session = SessionManager.verifySession(token || null);
    const userId = session?.userId;
    if (!userId) throw new ApiError(401, "Authentication required");

    const body = await request.json();
    const data = createBudgetSchema.parse({ ...body, createdById: userId });

    const item = await BudgetService.create(data);

    return successResponse({
      id: item.id,
      projectId: item.projectId,
      wbsId: item.wbsId,
      costType: item.costType,
      estimatedAmount: item.estimatedAmount,
      createdAt: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
