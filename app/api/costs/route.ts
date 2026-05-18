import { handleApiError, successResponse } from "@/lib/api-error";
import { createCostSchema } from "@/lib/validations";
import { CostService } from "@/services/cost.service";
import { assertAuthenticated } from "@/lib/auth-guard";
import { RBAC } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { headers } from "next/headers";

async function getServiceOptions(userId: string) {
  const head = await headers();
  return {
    userId,
    correlationId: head.get("x-correlation-id") || crypto.randomUUID(),
    ipAddress: head.get("x-forwarded-for") || head.get("remote-addr") || undefined,
    userAgent: head.get("user-agent") || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "COST", "READ");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    
    if (!projectId) return successResponse([]);

    // Check project tenant access first if not internal admin
    if (user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const filters = {
      costType: searchParams.get("costType") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    const items = await CostService.findByProject(projectId, filters, user.companyId);

    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertAuthenticated();
    RBAC.assertPermission(user.role, "COST", "CREATE");

    const body = await request.json();
    const data = createCostSchema.parse(body);

    // Verify project belongs to tenant
    if (user.companyId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, companyId: user.companyId }
      });
      if (!project) {
        throw new ApiError(403, "Từ chối truy cập: Dự án không thuộc công ty của bạn.");
      }
    }

    const options = await getServiceOptions(user.id);
    const item = await CostService.create(data, options);

    return successResponse(item, { correlationId: options.correlationId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


