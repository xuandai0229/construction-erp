import { handleApiError, successResponse } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { CostType } from "@prisma/client";
import { z } from "zod";

const createBudgetSchema = z.object({
  projectId: z.string().uuid(),
  wbsId: z.string().uuid(),
  costType: z.nativeEnum(CostType).default(CostType.material),
  estimatedAmount: z.number().positive(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;

    const items = await prisma.budgetRecord.findMany({
      where: { ...(projectId && { project_id: projectId }) },
      orderBy: { createdAt: "asc" },
    });

    const mapped = items.map((b) => ({
      id: b.id,
      project_id: b.project_id,
      wbs_id: b.wbs_id,
      cost_type: b.cost_type,
      estimated_amount: b.estimated_amount,
      created_at: b.createdAt.toISOString(),
    }));
    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createBudgetSchema.parse(body);

    const item = await prisma.budgetRecord.create({
      data: {
        project_id: data.projectId,
        wbs_id: data.wbsId,
        cost_type: data.costType,
        estimated_amount: data.estimatedAmount,
      },
    });

    return successResponse({
      id: item.id,
      project_id: item.project_id,
      wbs_id: item.wbs_id,
      cost_type: item.cost_type,
      estimated_amount: item.estimated_amount,
      created_at: item.createdAt.toISOString(),
    }, null, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
