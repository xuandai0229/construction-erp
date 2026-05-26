import { handleApiError, successResponse, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/auth-guard";

export async function GET(request: Request) {
  try {
    const user = await assertAuthenticated();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const accountCode = searchParams.get("accountCode");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    if (!projectId) {
      throw new ApiError(400, "ProjectId is required");
    }

    if (!accountCode) {
      throw new ApiError(400, "AccountCode is required");
    }

    // Tenant Isolation Check
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (user.companyId && project.companyId !== user.companyId) {
      throw new ApiError(403, "Access denied to project ledger");
    }

    // Build query conditions
    const whereCondition = {
      account: { code: { startsWith: accountCode } },
      journalEntry: {
        projectId,
        deletedAt: null
      },
      deletedAt: null
    };

    // Parallel Count & Query for optimized performance
    const [total, lines] = await Promise.all([
      prisma.transactionLine.count({ where: whereCondition }),
      prisma.transactionLine.findMany({
        where: whereCondition,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          account: {
            select: {
              code: true,
              name: true
            }
          },
          journalEntry: {
            select: {
              id: true,
              date: true,
              reference: true,
              sourceType: true,
              sourceId: true,
              description: true
            }
          }
        },
        orderBy: { journalEntry: { date: "desc" } },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return successResponse({
      lines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
